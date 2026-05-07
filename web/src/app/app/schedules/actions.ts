"use server";

import { revalidatePath } from "next/cache";
import { ensureDemoGym } from "@/lib/repositories";
import {
  buildSolverRunInput,
  loadNormalizedPlannerInputForGym,
  persistGeneratedScheduleDraft,
  runCpSatAssignment,
} from "@/lib/planner";

export async function generateScheduleAction(formData: FormData) {
  const gym = await ensureDemoGym();
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim();

  if (!startDate || !endDate) {
    throw new Error("Start and end date are required.");
  }

  const plannerInput = await loadNormalizedPlannerInputForGym(gym.id);
  const horizon = { startDate, endDate };
  const solverInput = buildSolverRunInput(plannerInput, horizon);
  const solverResult = await runCpSatAssignment(plannerInput, solverInput);
  await persistGeneratedScheduleDraft(gym.id, horizon, solverInput, solverResult);

  revalidatePath("/app/schedules");
  revalidatePath("/app/constraints");
}
