import type {
  NormalizedPlannerInput,
  PlannerArea,
  PlannerTimeWindow,
} from "@/lib/planner/types";

export type PlannerDemandBlock = {
  id: string;
  areaId: string;
  areaName: string;
  workDate: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  minStaff: number;
  maxStaff: number | null;
};

export type PlannerDemandGenerationResult = {
  startDate: string;
  endDate: string;
  gridMinutes: number;
  blocks: PlannerDemandBlock[];
};

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getWeekdayMondayFirst(value: Date): number {
  const day = value.getUTCDay();
  return day === 0 ? 7 : day;
}

function* eachDate(startDate: string, endDate: string): Generator<Date> {
  let cursor = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  while (cursor <= end) {
    yield cursor;
    cursor = addDays(cursor, 1);
  }
}

function buildAreaBlocksForDate(
  area: PlannerArea,
  workDate: string,
  weekday: number,
  gridMinutes: number,
  openingHours: PlannerTimeWindow[],
): PlannerDemandBlock[] {
  const blocks: PlannerDemandBlock[] = [];

  for (const window of openingHours) {
    let start = window.startMinutes;

    while (start < window.endMinutes) {
      const end = Math.min(start + gridMinutes, window.endMinutes);
      blocks.push({
        id: `${area.id}:${workDate}:${start}-${end}`,
        areaId: area.id,
        areaName: area.name,
        workDate,
        weekday,
        startMinutes: start,
        endMinutes: end,
        minStaff: area.minStaffDefault,
        maxStaff: area.maxStaffDefault,
      });
      start = end;
    }
  }

  return blocks;
}

export function generateDemandBlocks(
  input: NormalizedPlannerInput,
  startDate: string,
  endDate: string,
): PlannerDemandGenerationResult {
  const blocks: PlannerDemandBlock[] = [];
  const gridMinutes = input.constraints.planningGridMinutes;

  for (const date of eachDate(startDate, endDate)) {
    const workDate = toIsoDate(date);
    const weekday = getWeekdayMondayFirst(date);

    for (const area of input.areas) {
      const openingHours = area.openingHours.filter((window) => window.weekday === weekday);
      blocks.push(...buildAreaBlocksForDate(area, workDate, weekday, gridMinutes, openingHours));
    }
  }

  return {
    startDate,
    endDate,
    gridMinutes,
    blocks,
  };
}

export function summarizeDemandBlocks(result: PlannerDemandGenerationResult) {
  const areaIds = new Set(result.blocks.map((block) => block.areaId));
  const workDates = new Set(result.blocks.map((block) => block.workDate));

  return {
    blockCount: result.blocks.length,
    coveredAreaCount: areaIds.size,
    coveredDayCount: workDates.size,
  };
}
