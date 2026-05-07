import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoGym, getAreasForGym } from "@/lib/repositories";
import { redirect } from "next/navigation";
import { createAreaAction } from "./actions";

export default async function AreasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const gym = await ensureDemoGym();
  const areas = await getAreasForGym(gym.id);

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Areas</p>
        <h1>Operational areas</h1>
        <p className="lead">
          Areas are now loaded from the database and can be created directly from the app.
        </p>
      </section>

      <section className="stack two-column">
        <article className="card">
          <div className="section-head-row">
            <div>
              <h2>Current areas</h2>
              <p>{areas.length} area records stored for {gym.name}.</p>
            </div>
          </div>
          <div className="grid single-column">
            {areas.map((area: Awaited<ReturnType<typeof getAreasForGym>>[number]) => (
              <article key={area.id} className="area-card area-card-inline">
                <div>
                  <h2>{area.name}</h2>
                  <p>
                    Default staffing: minimum {area.minStaffDefault}
                    {area.maxStaffDefault ? `, maximum ${area.maxStaffDefault}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card form-card">
          <h2>Add area</h2>
          <form action={createAreaAction} className="form-grid">
            <label>
              <span>Name</span>
              <input name="name" type="text" placeholder="Reception" required />
            </label>
            <label>
              <span>Minimum staff</span>
              <input name="minStaffDefault" type="number" min="1" defaultValue="1" required />
            </label>
            <label>
              <span>Maximum staff</span>
              <input name="maxStaffDefault" type="number" min="1" placeholder="Optional" />
            </label>
            <button className="button-primary" type="submit">Save area</button>
          </form>
        </article>
      </section>
    </main>
  );
}
