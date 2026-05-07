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

export async function getConstraintConfigForGym(gymId: string) {
  return prisma.constraintConfig.findUnique({ where: { gymId } });
}

export async function getOpeningHoursForGym(gymId: string) {
  return prisma.openingHour.findMany({
    where: { gymId },
    include: { area: true },
    orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
  });
}

export async function getEmployeesWithQualificationsForGym(gymId: string) {
  return prisma.employee.findMany({
    where: { gymId },
    include: {
      qualifications: {
        include: {
          area: true,
        },
      },
    },
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
      openingHours: {
        create: [
          { weekday: 1, startMinutes: 480, endMinutes: 1320 },
          { weekday: 2, startMinutes: 480, endMinutes: 1320 },
          { weekday: 3, startMinutes: 480, endMinutes: 1320 },
          { weekday: 4, startMinutes: 480, endMinutes: 1320 },
          { weekday: 5, startMinutes: 480, endMinutes: 1260 },
          { weekday: 6, startMinutes: 540, endMinutes: 1080 },
        ],
      },
      constraintConfig: {
        create: {},
      },
    },
    include: {
      users: true,
    },
  });
}
