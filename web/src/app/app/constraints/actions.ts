"use server";

import { prisma } from "@/lib/prisma";
import { ensureDemoGym } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

export async function saveConstraintConfigAction(formData: FormData) {
  const gym = await ensureDemoGym();

  await prisma.constraintConfig.upsert({
    where: { gymId: gym.id },
    update: {
      minRestHours: Number(formData.get("minRestHours") || 11),
      planningGridMinutes: Number(formData.get("planningGridMinutes") || 30),
      allowSplitShifts: formData.get("allowSplitShifts") === "on",
      maxConsecutiveDays: Number(formData.get("maxConsecutiveDays") || 6),
      preferBalancedWeekends: formData.get("preferBalancedWeekends") === "on",
    },
    create: {
      gymId: gym.id,
      minRestHours: Number(formData.get("minRestHours") || 11),
      planningGridMinutes: Number(formData.get("planningGridMinutes") || 30),
      allowSplitShifts: formData.get("allowSplitShifts") === "on",
      maxConsecutiveDays: Number(formData.get("maxConsecutiveDays") || 6),
      preferBalancedWeekends: formData.get("preferBalancedWeekends") === "on",
    },
  });

  revalidatePath("/app/constraints");
}

export async function createOpeningHourAction(formData: FormData) {
  const gym = await ensureDemoGym();
  const weekday = Number(formData.get("weekday") || 0);
  const areaId = String(formData.get("areaId") || "").trim();
  const start = String(formData.get("start") || "08:00");
  const end = String(formData.get("end") || "18:00");

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  await prisma.openingHour.create({
    data: {
      gymId: gym.id,
      areaId: areaId || null,
      weekday,
      startMinutes: toMinutes(start),
      endMinutes: toMinutes(end),
    },
  });

  revalidatePath("/app/constraints");
}

export async function assignEmployeeAreaAction(formData: FormData) {
  const employeeId = String(formData.get("employeeId") || "").trim();
  const areaId = String(formData.get("areaId") || "").trim();
  if (!employeeId || !areaId) return;

  await prisma.employeeArea.upsert({
    where: {
      employeeId_areaId: {
        employeeId,
        areaId,
      },
    },
    update: {},
    create: {
      employeeId,
      areaId,
    },
  });

  revalidatePath("/app/constraints");
}
