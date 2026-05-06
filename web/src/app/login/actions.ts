"use server";

import { redirect } from "next/navigation";
import { createDemoSession } from "@/lib/auth";

export async function loginAction() {
  await createDemoSession();
  redirect("/app");
}
