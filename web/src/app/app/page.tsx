import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";
import { ensureDemoGym, getAreasForGym, getEmployeesForGym } from "@/lib/repositories";

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

  const gym = await ensureDemoGym();
  const [employees, areas] = await Promise.all([
    getEmployeesForGym(gym.id),
    getAreasForGym(gym.id),
  ]);

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Authenticated demo area</p>
        <h1>{user.gymName}</h1>
        <p className="lead">
          The rebuild now has the first real database-backed management flow. Next steps are richer
          validation, more entities, and scheduler integration.
        </p>
      </section>

      <section className="stats-grid">
        <article className="card stat-card">
          <strong>{employees.length}</strong>
          <span>Employees</span>
        </article>
        <article className="card stat-card">
          <strong>{areas.length}</strong>
          <span>Areas</span>
        </article>
        <article className="card stat-card">
          <strong>1</strong>
          <span>Gym workspace</span>
        </article>
      </section>

      <section className="grid single-column">
        {sections.map((item, index) => (
          <article key={item} className="card row-card">
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <div>
              <h2>{item}</h2>
              <p>Now being turned into actual product modules instead of placeholder-only setup.</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
