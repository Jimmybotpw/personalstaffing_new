from __future__ import annotations

import json
import sys
from collections import defaultdict
from ortools.sat.python import cp_model


def overlaps(a, b):
    return a["workDate"] == b["workDate"] and a["startMinutes"] < b["endMinutes"] and a["endMinutes"] > b["startMinutes"]


def rest_conflict(a, b, min_rest_minutes: int):
    if a["workDate"] != b["workDate"]:
        return False
    if overlaps(a, b):
        return True
    if a["endMinutes"] <= b["startMinutes"]:
        return b["startMinutes"] - a["endMinutes"] < min_rest_minutes
    if b["endMinutes"] <= a["startMinutes"]:
        return a["startMinutes"] - b["endMinutes"] < min_rest_minutes
    return False


def main():
    payload = json.load(sys.stdin)
    employees = payload["employees"]
    demand_blocks = payload["demandBlocks"]
    eligibility = {item["demandBlockId"]: item["eligibleEmployeeIds"] for item in payload["eligibility"]}
    min_rest_minutes = payload["constraints"]["minRestHours"] * 60

    model = cp_model.CpModel()
    assign = {}
    uncovered = {}

    employee_by_id = {employee["id"]: employee for employee in employees}

    for block in demand_blocks:
        block_id = block["id"]
        eligible_ids = eligibility.get(block_id, [])
        for employee_id in eligible_ids:
            assign[(block_id, employee_id)] = model.NewBoolVar(f"assign__{block_id}__{employee_id}")
        uncovered[block_id] = model.NewIntVar(0, block["minStaff"], f"uncovered__{block_id}")

        block_assignments = [assign[(block_id, employee_id)] for employee_id in eligible_ids]
        model.Add(sum(block_assignments) + uncovered[block_id] == block["minStaff"])
        if block["maxStaff"] is not None:
            model.Add(sum(block_assignments) <= block["maxStaff"])

    for employee in employees:
        employee_id = employee["id"]
        employee_blocks = [block for block in demand_blocks if (block["id"], employee_id) in assign]

        for i, left in enumerate(employee_blocks):
            for right in employee_blocks[i + 1 :]:
                if rest_conflict(left, right, min_rest_minutes):
                    model.Add(assign[(left["id"], employee_id)] + assign[(right["id"], employee_id)] <= 1)

        minutes_terms = []
        target_terms = []
        for block in employee_blocks:
            duration = block["durationMinutes"]
            minutes_var = model.NewIntVar(0, duration, f"minutes__{employee_id}__{block['id']}")
            model.Add(minutes_var == assign[(block["id"], employee_id)] * duration)
            minutes_terms.append(minutes_var)
            target_terms.append(minutes_var)

        total_minutes = model.NewIntVar(0, employee["maxMinutesWeek"], f"total_minutes__{employee_id}")
        model.Add(total_minutes == sum(minutes_terms))
        model.Add(total_minutes <= employee["maxMinutesWeek"])

        under_target = model.NewIntVar(0, employee["targetMinutesWeek"], f"under_target__{employee_id}")
        over_target = model.NewIntVar(0, employee["maxMinutesWeek"], f"over_target__{employee_id}")
        model.Add(total_minutes - employee["targetMinutesWeek"] == over_target - under_target)
        employee_by_id[employee_id]["underTargetVar"] = under_target
        employee_by_id[employee_id]["overTargetVar"] = over_target

    uncovered_total = sum(uncovered.values())
    under_target_total = sum(employee["underTargetVar"] for employee in employees)
    over_target_total = sum(employee["overTargetVar"] for employee in employees)
    model.Minimize(uncovered_total * 100000 + under_target_total * 10 + over_target_total)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(payload.get("timeLimitSeconds", 15))
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    status_name = solver.StatusName(status)
    assignments = []
    open_demand = []

    for (block_id, employee_id), var in assign.items():
        if solver.Value(var) == 1:
            assignments.append({"demandBlockId": block_id, "employeeId": employee_id})

    for block in demand_blocks:
        missing = solver.Value(uncovered[block["id"]])
        if missing > 0:
            open_demand.append({"demandBlockId": block["id"], "missingStaff": missing})

    result = {
        "status": "OPTIMAL" if status_name == "OPTIMAL" else "FEASIBLE" if status_name in {"FEASIBLE", "OPTIMAL"} else "INFEASIBLE",
        "solverStatus": status_name,
        "assignments": assignments,
        "openDemand": open_demand,
        "warnings": [] if not open_demand else ["CP-SAT could not cover all required demand."],
    }
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
