import { AppNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureDemoGym,
  getAreasForGym,
  getConstraintConfigForGym,
  getEmployeesWithQualificationsForGym,
  getOpeningHoursForGym,
} from "@/lib/repositories";
import { redirect } from "next/navigation";
import {
  assignEmployeeAreaAction,
  createOpeningHourAction,
  saveConstraintConfigAction,
} from "./actions";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function ConstraintsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const gym = await ensureDemoGym();
  const [config, openingHours, employees, areas] = await Promise.all([
    getConstraintConfigForGym(gym.id),
    getOpeningHoursForGym(gym.id),
    getEmployeesWithQualificationsForGym(gym.id),
    getAreasForGym(gym.id),
  ]);

  return (
    <main className="page">
      <AppNav />
      <section className="hero compact">
        <p className="eyebrow">Constraints</p>
        <h1>Planning input</h1>
        <p className="lead">
          This is now the real setup layer before the planner: core rules, opening hours, and who can
          work in which area.
        </p>
      </section>

      <section className="stack">
        <article className="card">
          <div className="section-head-row">
            <div>
              <h2>Planner defaults</h2>
              <p>Base rules for how schedules should be generated.</p>
            </div>
          </div>
          <form action={saveConstraintConfigAction} className="form-grid constraint-grid">
            <label>
              <span>Minimum rest hours</span>
              <input name="minRestHours" type="number" min="1" defaultValue={config?.minRestHours ?? 11} required />
            </label>
            <label>
              <span>Planning grid (minutes)</span>
              <input name="planningGridMinutes" type="number" min="5" step="5" defaultValue={config?.planningGridMinutes ?? 30} required />
            </label>
            <label>
              <span>Maximum consecutive days</span>
              <input name="maxConsecutiveDays" type="number" min="1" max="14" defaultValue={config?.maxConsecutiveDays ?? 6} required />
            </label>
            <label className="checkbox-row">
              <input name="allowSplitShifts" type="checkbox" defaultChecked={config?.allowSplitShifts ?? false} />
              <span>Allow split shifts</span>
            </label>
            <label className="checkbox-row">
              <input name="preferBalancedWeekends" type="checkbox" defaultChecked={config?.preferBalancedWeekends ?? true} />
              <span>Prefer balanced weekends</span>
            </label>
            <button className="button-primary" type="submit">Save rules</button>
          </form>
        </article>

        <section className="stack two-column">
          <article className="card">
            <div className="section-head-row">
              <div>
                <h2>Opening hours</h2>
                <p>Defines when the gym or specific areas are open and schedulable.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Area</th>
                    <th>Start</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  {openingHours.map((slot) => (
                    <tr key={slot.id}>
                      <td>{weekdayLabels[slot.weekday - 1] ?? `Day ${slot.weekday}`}</td>
                      <td>{slot.area?.name ?? "Gym-wide"}</td>
                      <td>{formatMinutes(slot.startMinutes)}</td>
                      <td>{formatMinutes(slot.endMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card form-card">
            <h2>Add opening hours</h2>
            <form action={createOpeningHourAction} className="form-grid">
              <label>
                <span>Weekday</span>
                <select name="weekday" defaultValue="1">
                  {weekdayLabels.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Area</span>
                <select name="areaId" defaultValue="">
                  <option value="">Gym-wide</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Start</span>
                <input name="start" type="time" defaultValue="08:00" required />
              </label>
              <label>
                <span>End</span>
                <input name="end" type="time" defaultValue="18:00" required />
              </label>
              <button className="button-primary" type="submit">Save hours</button>
            </form>
          </article>
        </section>

        <article className="card">
          <div className="section-head-row">
            <div>
              <h2>Area qualifications</h2>
              <p>Defines which employees can be planned in which operational area.</p>
            </div>
          </div>
          <div className="qualification-grid">
            {employees.map((employee) => (
              <article key={employee.id} className="qualification-card">
                <div>
                  <h2>{employee.name}</h2>
                  <p>
                    Current areas: {employee.qualifications.length > 0
                      ? employee.qualifications.map((entry) => entry.area.name).join(", ")
                      : "None assigned yet"}
                  </p>
                </div>
                <form action={assignEmployeeAreaAction} className="inline-form">
                  <input type="hidden" name="employeeId" value={employee.id} />
                  <select name="areaId" defaultValue="">
                    <option value="" disabled>
                      Assign area…
                    </option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <button className="button-secondary" type="submit">Assign</button>
                </form>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
