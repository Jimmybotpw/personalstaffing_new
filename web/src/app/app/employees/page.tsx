import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import { demoEmployees } from "@/lib/demo-data";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Employees</p>
        <h1>Team setup</h1>
        <p className="lead">
          This is the first real management screen direction for the rebuild: employee master data,
          target hours, and operational flags.
        </p>
      </section>

      <section className="stack">
        <article className="card">
          <div className="section-head-row">
            <div>
              <h2>Current team</h2>
              <p>Demo data for the first product flow.</p>
            </div>
            <button className="button-primary" type="button">Add employee</button>
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
                {demoEmployees.map((employee) => (
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
          <h2>What this page will become</h2>
          <ul className="feature-list">
            <li>Create and edit employees</li>
            <li>Store hours, qualifications, vacations, and availability</li>
            <li>Prepare clean scheduling input for the solver</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
