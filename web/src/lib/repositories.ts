import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";

export async function getGymBySlug(slug: string) {
  return prisma.gym.findUnique({ where: { slug } });
}

export async function getEmployeesForGym(gymId: string) {
  return prisma.employee.findMany({
    where: { gymId },
    orderBy: { name: "asc" },
  });
}

export async function getAreasForGym(gymId: string) {
  return prisma.area.findMany({
    where: { gymId },
    orderBy: { name: "asc" },
  });
}

export async function ensureDemoGym() {
  const existing = await prisma.gym.findUnique({
    where: { slug: "demo-gym" },
    include: { users: true },
  });

  if (existing) {
    const demoUser = existing.users.find((user) => user.email === "owner@example.com");
    if (demoUser && !demoUser.passwordHash.startsWith("scrypt:")) {
      await prisma.user.update({
        where: { id: demoUser.id },
        data: { passwordHash: hashPassword("demo1234") },
      });
    }
    return existing;
  }

  return prisma.gym.create({
    data: {
      name: "Demo Gym",
      slug: "demo-gym",
      users: {
        create: {
          email: "owner@example.com",
          passwordHash: hashPassword("demo1234"),
          name: "Demo Owner",
        },
      },
      areas: {
        create: [
          { name: "Welcome Desk", minStaffDefault: 1, maxStaffDefault: 1 },
          { name: "Training Floor", minStaffDefault: 1, maxStaffDefault: 2 },
        ],
      },
      employees: {
        create: [
          {
            name: "Alex Meyer",
            targetHoursWeek: 32,
            maxHoursWeek: 40,
            weekendService: true,
            openCloseService: true,
          },
          {
            name: "Samira Koch",
            targetHoursWeek: 20,
            maxHoursWeek: 24,
            weekendService: false,
            openCloseService: false,
          },
        ],
      },
      constraintConfig: {
        create: {},
      },
    },
  });
}
