import { cookies } from "next/headers";

export type AuthUser = {
  id: string;
  email: string;
  gymName: string;
};

const DEMO_SESSION = "demo-owner-session";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const session = store.get("session")?.value;
  if (!session || session !== DEMO_SESSION) return null;

  return {
    id: "demo-user",
    email: "owner@example.com",
    gymName: "Demo Gym",
  };
}

export async function createDemoSession() {
  const store = await cookies();
  store.set("session", DEMO_SESSION, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete("session");
}
