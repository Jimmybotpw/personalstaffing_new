import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const constraints = [
  ["Minimum rest time", "11 hours"],
  ["Planning grid", "30 minutes"],
  ["Split shifts", "Disabled by default"],
  ["Weekend balancing", "Preferred"],
];

export default async function ConstraintsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Constraints</p>
        <h1>Scheduling rules</h1>
        <p className="lead">
          This area will become the main control surface for planning behavior and solver rules.
        </p>
      </section>

      <section className="grid single-column">
        <article className="card">
          <h2>Core planner defaults</h2>
          <div className="kv-list">
            {constraints.map(([label, value]) => (
              <div key={label} className="kv-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
