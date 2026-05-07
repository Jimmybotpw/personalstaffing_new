"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { ensureDemoGym } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";

export async function loginAction(formData: FormData) {
  await ensureDemoGym();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/app");
}
