export type PlannerTimeWindow = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

export type PlannerDateRange = {
  startDate: string;
  endDate: string;
};

export type PlannerEmployee = {
  id: string;
  name: string;
  targetHoursWeek: number;
  maxHoursWeek: number;
  weekendService: boolean;
  openCloseService: boolean;
  splitService: boolean;
  qualificationAreaIds: string[];
  vacations: PlannerDateRange[];
  fixedTimes: PlannerTimeWindow[];
  availability: Array<
    PlannerTimeWindow & {
      type: "AVAILABLE" | "UNAVAILABLE" | "PREFERRED";
    }
  >;
};

export type PlannerArea = {
  id: string;
  name: string;
  minStaffDefault: number;
  maxStaffDefault: number | null;
  openingHours: PlannerTimeWindow[];
};

export type PlannerCourse = {
  id: string;
  name: string;
  primaryEmployeeId: string | null;
  substitutable: boolean;
};

export type PlannerConstraintConfig = {
  minRestHours: number;
  planningGridMinutes: number;
  allowSplitShifts: boolean;
  maxConsecutiveDays: number;
  preferBalancedWeekends: boolean;
};

export type PlannerInput = {
  gymId: string;
  timezone: string;
  employees: PlannerEmployee[];
  areas: PlannerArea[];
  courses: PlannerCourse[];
  constraints: PlannerConstraintConfig;
};

export type PlannerInputSummary = {
  employeeCount: number;
  areaCount: number;
  courseCount: number;
  vacationCount: number;
  fixedTimeCount: number;
  availabilityCount: number;
  qualificationCount: number;
};

export type NormalizedPlannerInput = PlannerInput & {
  summary: PlannerInputSummary;
};

export type PlannerHorizon = {
  startDate: string;
  endDate: string;
};
