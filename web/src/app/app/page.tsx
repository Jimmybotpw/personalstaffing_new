import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";

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
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Authenticated demo area</p>
        <h1>{user.gymName}</h1>
        <p className="lead">
          The rebuild now has first concrete management screens. Next steps are real persistence,
          validation, and the actual scheduler integration.
        </p>
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
