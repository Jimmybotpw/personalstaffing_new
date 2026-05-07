import type {
  NormalizedPlannerInput,
  PlannerConstraintConfig,
  PlannerInput,
  PlannerInputSummary,
  PlannerTimeWindow,
} from "@/lib/planner/types";

function sortWindows<T extends PlannerTimeWindow>(windows: T[]): T[] {
  return [...windows].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return a.endMinutes - b.endMinutes;
  });
}

function normalizeConstraints(constraints: PlannerConstraintConfig): PlannerConstraintConfig {
  return {
    ...constraints,
    minRestHours: Math.max(0, constraints.minRestHours),
    planningGridMinutes: constraints.planningGridMinutes > 0 ? constraints.planningGridMinutes : 30,
    maxConsecutiveDays: Math.max(1, constraints.maxConsecutiveDays),
  };
}

export function summarizePlannerInput(input: PlannerInput): PlannerInputSummary {
  return {
    employeeCount: input.employees.length,
    areaCount: input.areas.length,
    courseCount: input.courses.length,
    vacationCount: input.employees.reduce((sum, employee) => sum + employee.vacations.length, 0),
    fixedTimeCount: input.employees.reduce((sum, employee) => sum + employee.fixedTimes.length, 0),
    availabilityCount: input.employees.reduce((sum, employee) => sum + employee.availability.length, 0),
    qualificationCount: input.employees.reduce(
      (sum, employee) => sum + employee.qualificationAreaIds.length,
      0,
    ),
  };
}

export function normalizePlannerInput(input: PlannerInput): NormalizedPlannerInput {
  return {
    ...input,
    constraints: normalizeConstraints(input.constraints),
    employees: input.employees
      .map((employee) => ({
        ...employee,
        qualificationAreaIds: [...employee.qualificationAreaIds].sort(),
        fixedTimes: sortWindows(employee.fixedTimes),
        availability: sortWindows(employee.availability),
        vacations: [...employee.vacations].sort((a, b) => a.startDate.localeCompare(b.startDate)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    areas: input.areas
      .map((area) => ({
        ...area,
        openingHours: sortWindows(area.openingHours),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    courses: [...input.courses].sort((a, b) => a.name.localeCompare(b.name)),
    summary: summarizePlannerInput(input),
  };
}
