import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export const EXAMPLE_EXCEL_PATH = "/data/.openclaw/media/inbound/Demo_Version_DB---5ae77b25-9a31-4266-8ce6-b151ae3c8549.xlsx";

type ImportedDataset = {
  employees: Array<{
    name: string;
    targetHoursWeek: number;
    maxHoursWeek: number;
    weekendService: boolean;
    openCloseService: boolean;
    splitService: boolean;
    fixedTimes: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
    blockedAreas: string[];
  }>;
  areas: Array<{
    name: string;
    openingHours: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
    allowedPeople: string[];
    minStaffDefault: number;
    maxStaffDefault: number | null;
  }>;
  courses: Array<{
    name: string;
    primaryEmployeeName: string;
    times: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
  }>;
  constraintConfig: {
    minRestHours: number;
    planningGridMinutes: number;
    allowSplitShifts: boolean;
    maxConsecutiveDays: number;
    preferBalancedWeekends: boolean;
  };
};

export async function parseExampleExcel(pathToFile = EXAMPLE_EXCEL_PATH): Promise<ImportedDataset> {
  const scriptPath = path.join(process.cwd(), "python", "import_example_excel.py");

  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath, pathToFile], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Excel import parser exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as ImportedDataset);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function importExampleDataIntoGym(gymId: string, pathToFile = EXAMPLE_EXCEL_PATH) {
  const dataset = await parseExampleExcel(pathToFile);

  await prisma.$transaction(async (tx) => {
    await tx.schedule.deleteMany({ where: { gymId } });
    await tx.openingHour.deleteMany({ where: { gymId } });
    await tx.employeeArea.deleteMany({ where: { employee: { gymId } } });
    await tx.fixedTime.deleteMany({ where: { employee: { gymId } } });
    await tx.availability.deleteMany({ where: { employee: { gymId } } });
    await tx.vacation.deleteMany({ where: { employee: { gymId } } });
    await tx.course.deleteMany({ where: { gymId } });
    await tx.area.deleteMany({ where: { gymId } });
    await tx.employee.deleteMany({ where: { gymId } });
    await tx.constraintConfig.deleteMany({ where: { gymId } });

    await tx.constraintConfig.create({
      data: {
        gymId,
        ...dataset.constraintConfig,
      },
    });

    const createdEmployees = new Map<string, string>();
    for (const employee of dataset.employees) {
      const created = await tx.employee.create({
        data: {
          gymId,
          name: employee.name,
          targetHoursWeek: employee.targetHoursWeek,
          maxHoursWeek: employee.maxHoursWeek,
          weekendService: employee.weekendService,
          openCloseService: employee.openCloseService,
          splitService: employee.splitService,
          fixedTimes: {
            create: employee.fixedTimes,
          },
        },
      });
      createdEmployees.set(employee.name, created.id);
    }

    const createdAreas = new Map<string, string>();
    for (const area of dataset.areas) {
      const created = await tx.area.create({
        data: {
          gymId,
          name: area.name,
          minStaffDefault: area.minStaffDefault,
          maxStaffDefault: area.maxStaffDefault,
          openingHours: {
            create: area.openingHours.map((window) => ({ ...window, gymId })),
          },
        },
      });
      createdAreas.set(area.name, created.id);
    }

    for (const area of dataset.areas) {
      const areaId = createdAreas.get(area.name);
      if (!areaId) continue;
      for (const personName of area.allowedPeople) {
        const employeeId = createdEmployees.get(personName);
        if (!employeeId) continue;
        await tx.employeeArea.upsert({
          where: { employeeId_areaId: { employeeId, areaId } },
          update: {},
          create: { employeeId, areaId },
        });
      }
    }

    for (const course of dataset.courses) {
      await tx.course.create({
        data: {
          gymId,
          name: course.name,
          primaryEmployeeId: createdEmployees.get(course.primaryEmployeeName) ?? null,
          substitutable: false,
        },
      });
    }
  });

  return dataset;
}
