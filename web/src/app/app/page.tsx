import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const sections = [
  "Workspace setup",
  "Employees and roles",
  "Areas and opening times",
  "Constraints and scheduling rules",
  "Generated schedules and open shifts",
];

export default async function AppDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page">
      <section className="hero compact">
        <p className="eyebrow">Authenticated demo area</p>
        <h1>{user.gymName}</h1>
        <p className="lead">
          This protected area is the starting point for the real planner. Next steps are
          CRUD flows, constraints, and schedule generation.
        </p>
      </section>

      <section className="grid single-column">
        {sections.map((item, index) => (
          <article key={item} className="card row-card">
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <div>
              <h2>{item}</h2>
              <p>Planned as part of the rebuild sequence.</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
