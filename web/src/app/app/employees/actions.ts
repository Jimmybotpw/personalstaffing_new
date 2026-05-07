"use server";

import { ensureDemoGym } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEmployeeAction(formData: FormData) {
  const gym = await ensureDemoGym();
  const name = String(formData.get("name") || "").trim();
  const targetHoursWeek = Number(formData.get("targetHoursWeek") || 0);
  const maxHoursWeek = Number(formData.get("maxHoursWeek") || 0);

  if (!name || targetHoursWeek <= 0 || maxHoursWeek <= 0) return;

  await prisma.employee.create({
    data: {
      gymId: gym.id,
      name,
      targetHoursWeek,
      maxHoursWeek,
      weekendService: formData.get("weekendService") === "on",
      openCloseService: formData.get("openCloseService") === "on",
    },
  });

  revalidatePath("/app/employees");
}
