"use server";

import { revalidatePath } from "next/cache";
import { ensureDemoGym } from "@/lib/repositories";
import { importExampleDataIntoGym } from "@/lib/import-example-data";

export async function importExampleDatasetAction() {
  const gym = await ensureDemoGym();
  await importExampleDataIntoGym(gym.id);
  revalidatePath("/app/employees");
  revalidatePath("/app/areas");
  revalidatePath("/app/constraints");
  revalidatePath("/app/schedules");
}
