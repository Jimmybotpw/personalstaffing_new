import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { demoAreas } from "@/lib/demo-data";
import { redirect } from "next/navigation";

export default async function AreasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Areas</p>
        <h1>Operational areas</h1>
        <p className="lead">
          Areas define where work happens, how many people are needed, and how the planner should build shifts.
        </p>
      </section>

      <section className="grid single-column">
        {demoAreas.map((area) => (
          <article key={area.id} className="card area-card">
            <div>
              <h2>{area.name}</h2>
              <p>
                Default staffing: minimum {area.minStaffDefault}
                {area.maxStaffDefault ? `, maximum ${area.maxStaffDefault}` : ""}
              </p>
            </div>
            <button className="button-secondary" type="button">Edit area</button>
          </article>
        ))}
      </section>
    </main>
  );
}
