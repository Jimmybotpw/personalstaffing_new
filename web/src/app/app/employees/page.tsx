import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoGym, getEmployeesForGym } from "@/lib/repositories";
import { redirect } from "next/navigation";
import { createEmployeeAction } from "./actions";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const gym = await ensureDemoGym();
  const employees = await getEmployeesForGym(gym.id);

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Employees</p>
        <h1>Team setup</h1>
        <p className="lead">
          Employee master data is now wired to the database. This is the first real persistence layer
          for the rebuild.
        </p>
      </section>

      <section className="stack two-column">
        <article className="card">
          <div className="section-head-row">
            <div>
              <h2>Current team</h2>
              <p>{employees.length} employee records stored for {gym.name}.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Target / week</th>
                  <th>Max / week</th>
                  <th>Weekend</th>
                  <th>Open / close</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee: Awaited<ReturnType<typeof getEmployeesForGym>>[number]) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.targetHoursWeek}h</td>
                    <td>{employee.maxHoursWeek}h</td>
                    <td>{employee.weekendService ? "Yes" : "No"}</td>
                    <td>{employee.openCloseService ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card form-card">
          <h2>Add employee</h2>
          <form action={createEmployeeAction} className="form-grid">
            <label>
              <span>Name</span>
              <input name="name" type="text" placeholder="Jane Doe" required />
            </label>
            <label>
              <span>Target hours / week</span>
              <input name="targetHoursWeek" type="number" min="1" defaultValue="20" required />
            </label>
            <label>
              <span>Max hours / week</span>
              <input name="maxHoursWeek" type="number" min="1" defaultValue="24" required />
            </label>
            <label className="checkbox-row">
              <input name="weekendService" type="checkbox" />
              <span>Available for weekend service</span>
            </label>
            <label className="checkbox-row">
              <input name="openCloseService" type="checkbox" />
              <span>Can work opening and closing shifts</span>
            </label>
            <button className="button-primary" type="submit">Save employee</button>
          </form>
        </article>
      </section>
    </main>
  );
}
