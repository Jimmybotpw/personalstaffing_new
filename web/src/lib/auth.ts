import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  gymId: string;
  gymName: string;
  role: "OWNER" | "MANAGER";
};

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { gym: true } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    store.delete(SESSION_COOKIE);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    gymId: session.user.gymId,
    gymName: session.user.gym.name,
    role: session.user.role,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    expires: expiresAt,
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}
