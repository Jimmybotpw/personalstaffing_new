import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoGym } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function summarizeSchedule(schedule: {
  shifts: Array<{ openSlots: number; assignments: Array<unknown> }>;
}) {
  return schedule.shifts.reduce(
    (summary, shift) => {
      summary.assignmentCount += shift.assignments.length;
      summary.openSlotCount += shift.openSlots;
      if (shift.openSlots > 0) summary.openShiftCount += 1;
      return summary;
    },
    { assignmentCount: 0, openSlotCount: 0, openShiftCount: 0 },
  );
}

export default async function SchedulesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const gym = await ensureDemoGym();
  const schedules = await prisma.schedule.findMany({
    where: { gymId: gym.id },
    include: {
      shifts: {
        include: {
          area: true,
          assignments: {
            include: {
              employee: true,
            },
          },
        },
        orderBy: [{ workDate: "asc" }, { startMinutes: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Schedules</p>
        <h1>Generated schedule drafts</h1>
        <p className="lead">
          This is the first review surface for generated schedules coming from the planner.
        </p>
      </section>

      <section className="stack">
        {schedules.length === 0 ? (
          <article className="card">
            <h2>No schedules yet</h2>
            <p>Generate one from the constraints page to create the first draft.</p>
          </article>
        ) : (
          schedules.map((schedule) => {
            const summary = summarizeSchedule(schedule);

            return (
            <article key={schedule.id} className="card">
              <div className="section-head-row">
                <div>
                  <h2>
                    {schedule.startDate.toISOString().slice(0, 10)} → {schedule.endDate.toISOString().slice(0, 10)}
                  </h2>
                  <p>
                    Status: {schedule.status} · {schedule.shifts.length} shifts · {schedule.notes ?? "Generated draft"}
                  </p>
                </div>
              </div>
              <div className="stats-grid compact-stats">
                <article className="card stat-card">
                  <strong>{summary.assignmentCount}</strong>
                  <span>Assignments</span>
                </article>
                <article className="card stat-card">
                  <strong>{summary.openShiftCount}</strong>
                  <span>Open shifts</span>
                </article>
                <article className="card stat-card">
                  <strong>{summary.openSlotCount}</strong>
                  <span>Open slots</span>
                </article>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Area</th>
                      <th>Time</th>
                      <th>Assignments</th>
                      <th>Open slots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.shifts.map((shift) => (
                      <tr key={shift.id}>
                        <td>{shift.workDate.toISOString().slice(0, 10)}</td>
                        <td>{shift.area?.name ?? "Unknown area"}</td>
                        <td>
                          {formatMinutes(shift.startMinutes)} - {formatMinutes(shift.endMinutes)}
                        </td>
                        <td>
                          {shift.assignments.length > 0
                            ? shift.assignments.map((assignment) => assignment.employee.name).join(", ")
                            : "—"}
                        </td>
                        <td>{shift.openSlots}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );})
        )}
      </section>
    </main>
  );
}
