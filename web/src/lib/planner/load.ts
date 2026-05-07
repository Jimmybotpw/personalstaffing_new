import { getPlannerDatasetForGym } from "@/lib/repositories";
import { normalizePlannerInput } from "@/lib/planner/normalize";
import type { NormalizedPlannerInput, PlannerInput } from "@/lib/planner/types";

export async function loadPlannerInputForGym(gymId: string): Promise<PlannerInput> {
  const gym = await getPlannerDatasetForGym(gymId);

  return {
    gymId: gym.id,
    timezone: gym.timezone,
    employees: gym.employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      targetHoursWeek: employee.targetHoursWeek,
      maxHoursWeek: employee.maxHoursWeek,
      weekendService: employee.weekendService,
      openCloseService: employee.openCloseService,
      splitService: employee.splitService,
      qualificationAreaIds: employee.qualifications.map((qualification) => qualification.areaId),
      vacations: employee.vacations.map((vacation) => ({
        startDate: vacation.startDate.toISOString().slice(0, 10),
        endDate: vacation.endDate.toISOString().slice(0, 10),
      })),
      fixedTimes: employee.fixedTimes.map((fixedTime) => ({
        weekday: fixedTime.weekday,
        startMinutes: fixedTime.startMinutes,
        endMinutes: fixedTime.endMinutes,
      })),
      availability: employee.availability.map((availability) => ({
        weekday: availability.weekday,
        startMinutes: availability.startMinutes,
        endMinutes: availability.endMinutes,
        type: availability.type,
      })),
    })),
    areas: gym.areas.map((area) => ({
      id: area.id,
      name: area.name,
      minStaffDefault: area.minStaffDefault,
      maxStaffDefault: area.maxStaffDefault,
      openingHours: area.openingHours.map((openingHour) => ({
        weekday: openingHour.weekday,
        startMinutes: openingHour.startMinutes,
        endMinutes: openingHour.endMinutes,
      })),
    })),
    courses: gym.courses.map((course) => ({
      id: course.id,
      name: course.name,
      primaryEmployeeId: course.primaryEmployeeId,
      substitutable: course.substitutable,
    })),
    constraints: gym.constraintConfig
      ? {
          minRestHours: gym.constraintConfig.minRestHours,
          planningGridMinutes: gym.constraintConfig.planningGridMinutes,
          allowSplitShifts: gym.constraintConfig.allowSplitShifts,
          maxConsecutiveDays: gym.constraintConfig.maxConsecutiveDays,
          preferBalancedWeekends: gym.constraintConfig.preferBalancedWeekends,
        }
      : {
          minRestHours: 11,
          planningGridMinutes: 30,
          allowSplitShifts: false,
          maxConsecutiveDays: 6,
          preferBalancedWeekends: true,
        },
  };
}

export async function loadNormalizedPlannerInputForGym(
  gymId: string,
): Promise<NormalizedPlannerInput> {
  const input = await loadPlannerInputForGym(gymId);
  return normalizePlannerInput(input);
}
