import { buildBlockEligibility } from "@/lib/planner/eligibility";
import { generateDemandBlocks } from "@/lib/planner/generate";
import type {
  NormalizedPlannerInput,
  PlannerEmployee,
  PlannerHorizon,
} from "@/lib/planner/types";

export type SolverEmployee = {
  id: string;
  name: string;
  targetMinutesWeek: number;
  maxMinutesWeek: number;
  weekendService: boolean;
  openCloseService: boolean;
  splitService: boolean;
  qualificationAreaIds: string[];
};

export type SolverDemandBlock = {
  id: string;
  areaId: string;
  areaName: string;
  workDate: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  minStaff: number;
  maxStaff: number | null;
};

export type SolverRunInput = {
  gymId: string;
  timezone: string;
  horizon: PlannerHorizon;
  gridMinutes: number;
  employees: SolverEmployee[];
  demandBlocks: SolverDemandBlock[];
  constraints: NormalizedPlannerInput["constraints"];
};

export type SolverAssignment = {
  demandBlockId: string;
  employeeId: string;
};

export type SolverOpenDemand = {
  demandBlockId: string;
  missingStaff: number;
};

export type SolverRunResult = {
  status: "NOT_RUN" | "FEASIBLE" | "OPTIMAL" | "INFEASIBLE";
  assignments: SolverAssignment[];
  openDemand: SolverOpenDemand[];
  warnings: string[];
};

export type SolverRunSummary = {
  employeeCount: number;
  demandBlockCount: number;
  totalDemandMinutes: number;
  totalEmployeeCapacityMinutes: number;
};

export type BasicAssignmentSummary = {
  assignmentCount: number;
  coveredBlockCount: number;
  uncoveredBlockCount: number;
};

type EmployeeAssignedBlock = {
  workDate: string;
  startMinutes: number;
  endMinutes: number;
};

function mapEmployee(employee: PlannerEmployee): SolverEmployee {
  return {
    id: employee.id,
    name: employee.name,
    targetMinutesWeek: employee.targetHoursWeek * 60,
    maxMinutesWeek: employee.maxHoursWeek * 60,
    weekendService: employee.weekendService,
    openCloseService: employee.openCloseService,
    splitService: employee.splitService,
    qualificationAreaIds: [...employee.qualificationAreaIds],
  };
}

export function buildSolverRunInput(
  input: NormalizedPlannerInput,
  horizon: PlannerHorizon,
): SolverRunInput {
  const demand = generateDemandBlocks(input, horizon.startDate, horizon.endDate);

  return {
    gymId: input.gymId,
    timezone: input.timezone,
    horizon,
    gridMinutes: demand.gridMinutes,
    employees: input.employees.map(mapEmployee),
    demandBlocks: demand.blocks.map((block) => ({
      ...block,
      durationMinutes: block.endMinutes - block.startMinutes,
    })),
    constraints: input.constraints,
  };
}

export function summarizeSolverRunInput(input: SolverRunInput): SolverRunSummary {
  const totalDemandMinutes = input.demandBlocks.reduce(
    (sum, block) => sum + block.durationMinutes * block.minStaff,
    0,
  );

  const totalEmployeeCapacityMinutes = input.employees.reduce(
    (sum, employee) => sum + employee.maxMinutesWeek,
    0,
  );

  return {
    employeeCount: input.employees.length,
    demandBlockCount: input.demandBlocks.length,
    totalDemandMinutes,
    totalEmployeeCapacityMinutes,
  };
}

export function createEmptySolverRunResult(): SolverRunResult {
  return {
    status: "NOT_RUN",
    assignments: [],
    openDemand: [],
    warnings: [],
  };
}

function canAssignBlock(
  assignedBlocks: EmployeeAssignedBlock[],
  block: SolverDemandBlock,
  minRestHours: number,
) {
  const minRestMinutes = minRestHours * 60;

  for (const assigned of assignedBlocks) {
    if (assigned.workDate !== block.workDate) {
      continue;
    }

    const overlaps = block.startMinutes < assigned.endMinutes && block.endMinutes > assigned.startMinutes;
    if (overlaps) {
      return false;
    }

    const restBefore = block.startMinutes - assigned.endMinutes;
    const restAfter = assigned.startMinutes - block.endMinutes;
    const gap = restBefore >= 0 ? restBefore : restAfter;
    if (gap >= 0 && gap < minRestMinutes) {
      return false;
    }
  }

  return true;
}

export function runBasicAssignment(
  plannerInput: NormalizedPlannerInput,
  solverInput: SolverRunInput,
): SolverRunResult {
  const eligibility = buildBlockEligibility(plannerInput, solverInput);
  const employeeById = new Map(solverInput.employees.map((employee) => [employee.id, employee]));
  const minutesByEmployeeId = new Map<string, number>();
  const assignedBlocksByEmployeeId = new Map<string, EmployeeAssignedBlock[]>();
  const assignments: SolverAssignment[] = [];
  const openDemand: SolverOpenDemand[] = [];
  const warnings: string[] = [];

  for (const block of solverInput.demandBlocks) {
    const blockEligibility = eligibility.find((item) => item.demandBlockId === block.id);
    const eligibleEmployeeIds = blockEligibility?.eligibleEmployeeIds ?? [];

    const assignedForBlock: string[] = [];
    const sortedCandidates = [...eligibleEmployeeIds].sort((leftId, rightId) => {
      const leftMinutes = minutesByEmployeeId.get(leftId) ?? 0;
      const rightMinutes = minutesByEmployeeId.get(rightId) ?? 0;
      if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
      return leftId.localeCompare(rightId);
    });

    for (const employeeId of sortedCandidates) {
      if (assignedForBlock.length >= block.minStaff) break;

      const employee = employeeById.get(employeeId);
      if (!employee) continue;

      const currentMinutes = minutesByEmployeeId.get(employeeId) ?? 0;
      if (currentMinutes + block.durationMinutes > employee.maxMinutesWeek) {
        continue;
      }

      const assignedBlocks = assignedBlocksByEmployeeId.get(employeeId) ?? [];
      if (!canAssignBlock(assignedBlocks, block, solverInput.constraints.minRestHours)) {
        continue;
      }

      assignments.push({
        demandBlockId: block.id,
        employeeId,
      });
      assignedForBlock.push(employeeId);
      minutesByEmployeeId.set(employeeId, currentMinutes + block.durationMinutes);
      assignedBlocks.push({
        workDate: block.workDate,
        startMinutes: block.startMinutes,
        endMinutes: block.endMinutes,
      });
      assignedBlocksByEmployeeId.set(employeeId, assignedBlocks);
    }

    if (assignedForBlock.length < block.minStaff) {
      const missingStaff = block.minStaff - assignedForBlock.length;
      openDemand.push({
        demandBlockId: block.id,
        missingStaff,
      });
    }
  }

  if (openDemand.length > 0) {
    warnings.push(
      "Basic assignment could not cover all demand blocks with current eligibility, hour limits, and rest rules.",
    );
  }

  return {
    status: openDemand.length === 0 ? "FEASIBLE" : "INFEASIBLE",
    assignments,
    openDemand,
    warnings,
  };
}

export function summarizeBasicAssignment(result: SolverRunResult): BasicAssignmentSummary {
  const coveredBlockIds = new Set(result.assignments.map((assignment) => assignment.demandBlockId));
  const uncoveredBlockCount = result.openDemand.length;

  return {
    assignmentCount: result.assignments.length,
    coveredBlockCount: coveredBlockIds.size,
    uncoveredBlockCount,
  };
}
