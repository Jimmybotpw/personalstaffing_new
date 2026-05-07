"use server";

import { ensureDemoGym } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAreaAction(formData: FormData) {
  const gym = await ensureDemoGym();
  const name = String(formData.get("name") || "").trim();
  const minStaffDefault = Number(formData.get("minStaffDefault") || 1);
  const maxRaw = String(formData.get("maxStaffDefault") || "").trim();
  const maxStaffDefault = maxRaw ? Number(maxRaw) : null;

  if (!name || minStaffDefault <= 0) return;

  await prisma.area.create({
    data: {
      gymId: gym.id,
      name,
      minStaffDefault,
      maxStaffDefault: maxStaffDefault && maxStaffDefault > 0 ? maxStaffDefault : null,
    },
  });

  revalidatePath("/app/areas");
}
