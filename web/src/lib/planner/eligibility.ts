import type { NormalizedPlannerInput, PlannerEmployee } from "@/lib/planner/types";
import type { SolverDemandBlock, SolverRunInput } from "@/lib/planner/solve";

export type SolverEligibilityReason =
  | "QUALIFICATION"
  | "WEEKEND_SERVICE"
  | "VACATION"
  | "FIXED_TIME"
  | "UNAVAILABLE"
  | "OPEN_CLOSE_PERMISSION";

export type SolverBlockEligibility = {
  demandBlockId: string;
  eligibleEmployeeIds: string[];
  ineligibleByEmployeeId: Record<string, SolverEligibilityReason[]>;
};

export type SolverEligibilitySummary = {
  blockCount: number;
  fullyCoveredBlockCount: number;
  uncoveredBlockCount: number;
  totalEligibleLinks: number;
};

function isWeekend(weekday: number) {
  return weekday === 6 || weekday === 7;
}

function dateInRange(value: string, startDate: string, endDate: string) {
  return value >= startDate && value <= endDate;
}

function windowContainsBlock(
  weekday: number,
  startMinutes: number,
  endMinutes: number,
  windows: Array<{ weekday: number; startMinutes: number; endMinutes: number }>,
) {
  return windows.some(
    (window) =>
      window.weekday === weekday &&
      startMinutes >= window.startMinutes &&
      endMinutes <= window.endMinutes,
  );
}

function isOpeningOrClosingBlock(block: SolverDemandBlock, input: NormalizedPlannerInput) {
  const area = input.areas.find((entry) => entry.id === block.areaId);
  if (!area) return false;

  return area.openingHours.some(
    (window) =>
      window.weekday === block.weekday &&
      (block.startMinutes === window.startMinutes || block.endMinutes === window.endMinutes),
  );
}

function getEmployeeEligibilityReasons(
  employee: PlannerEmployee,
  block: SolverDemandBlock,
  input: NormalizedPlannerInput,
): SolverEligibilityReason[] {
  const reasons: SolverEligibilityReason[] = [];

  if (!employee.qualificationAreaIds.includes(block.areaId)) {
    reasons.push("QUALIFICATION");
  }

  if (isWeekend(block.weekday) && !employee.weekendService) {
    reasons.push("WEEKEND_SERVICE");
  }

  if (employee.vacations.some((vacation) => dateInRange(block.workDate, vacation.startDate, vacation.endDate))) {
    reasons.push("VACATION");
  }

  if (employee.fixedTimes.length > 0) {
    const fitsFixedTime = windowContainsBlock(
      block.weekday,
      block.startMinutes,
      block.endMinutes,
      employee.fixedTimes,
    );

    if (!fitsFixedTime) {
      reasons.push("FIXED_TIME");
    }
  }

  const unavailableWindows = employee.availability.filter((entry) => entry.type === "UNAVAILABLE");
  const blockedByUnavailability = unavailableWindows.some(
    (window) =>
      window.weekday === block.weekday &&
      block.startMinutes < window.endMinutes &&
      block.endMinutes > window.startMinutes,
  );
  if (blockedByUnavailability) {
    reasons.push("UNAVAILABLE");
  }

  if (block.areaName === "Welcome Desk" && isOpeningOrClosingBlock(block, input) && !employee.openCloseService) {
    reasons.push("OPEN_CLOSE_PERMISSION");
  }

  return reasons;
}

export function buildBlockEligibility(
  input: NormalizedPlannerInput,
  solverInput: SolverRunInput,
): SolverBlockEligibility[] {
  return solverInput.demandBlocks.map((block) => {
    const ineligibleByEmployeeId: Record<string, SolverEligibilityReason[]> = {};
    const eligibleEmployeeIds: string[] = [];

    for (const employee of input.employees) {
      const reasons = getEmployeeEligibilityReasons(employee, block, input);
      if (reasons.length === 0) {
        eligibleEmployeeIds.push(employee.id);
      } else {
        ineligibleByEmployeeId[employee.id] = reasons;
      }
    }

    return {
      demandBlockId: block.id,
      eligibleEmployeeIds,
      ineligibleByEmployeeId,
    };
  });
}

export function summarizeBlockEligibility(items: SolverBlockEligibility[]): SolverEligibilitySummary {
  const totalEligibleLinks = items.reduce((sum, item) => sum + item.eligibleEmployeeIds.length, 0);
  const uncoveredBlockCount = items.filter((item) => item.eligibleEmployeeIds.length === 0).length;

  return {
    blockCount: items.length,
    fullyCoveredBlockCount: items.length - uncoveredBlockCount,
    uncoveredBlockCount,
    totalEligibleLinks,
  };
}
