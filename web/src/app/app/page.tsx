import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";
import {
  buildBlockEligibility,
  buildSolverRunInput,
  generateDemandBlocks,
  loadNormalizedPlannerInputForGym,
  runBasicAssignment,
  summarizeBasicAssignment,
  summarizeBlockEligibility,
  summarizeDemandBlocks,
  summarizeSolverRunInput,
} from "@/lib/planner";
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
  const [employees, areas, plannerInput] = await Promise.all([
    getEmployeesForGym(gym.id),
    getAreasForGym(gym.id),
    loadNormalizedPlannerInputForGym(gym.id),
  ]);

  const horizon = { startDate: "2026-05-11", endDate: "2026-05-17" };
  const demand = generateDemandBlocks(plannerInput, horizon.startDate, horizon.endDate);
  const demandSummary = summarizeDemandBlocks(demand);
  const solverInput = buildSolverRunInput(plannerInput, horizon);
  const solverSummary = summarizeSolverRunInput(solverInput);
  const eligibility = buildBlockEligibility(plannerInput, solverInput);
  const eligibilitySummary = summarizeBlockEligibility(eligibility);
  const basicResult = runBasicAssignment(plannerInput, solverInput);
  const basicSummary = summarizeBasicAssignment(basicResult);

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
        <article className="card stat-card">
          <strong>{plannerInput.summary.qualificationCount}</strong>
          <span>Qualifications mapped</span>
        </article>
      </section>

      <section className="card">
        <p className="eyebrow">Planner foundation</p>
        <h2>Normalized input and first demand generation are wired in</h2>
        <p>
          Employees, areas, opening hours, qualifications, fixed times, vacations,
          availability, and constraint config now flow into one normalized planner input object,
          and area opening hours can already be expanded into grid-based demand blocks.
        </p>
        <div className="stats-grid">
          <article className="card stat-card">
            <strong>{demandSummary.blockCount}</strong>
            <span>Demand blocks (sample week)</span>
          </article>
          <article className="card stat-card">
            <strong>{demandSummary.coveredDayCount}</strong>
            <span>Days covered</span>
          </article>
          <article className="card stat-card">
            <strong>{demandSummary.coveredAreaCount}</strong>
            <span>Areas expanded</span>
          </article>
          <article className="card stat-card">
            <strong>{solverSummary.totalDemandMinutes}</strong>
            <span>Demand minutes</span>
          </article>
          <article className="card stat-card">
            <strong>{solverSummary.totalEmployeeCapacityMinutes}</strong>
            <span>Employee capacity minutes</span>
          </article>
          <article className="card stat-card">
            <strong>{eligibilitySummary.totalEligibleLinks}</strong>
            <span>Eligible employee-block links</span>
          </article>
          <article className="card stat-card">
            <strong>{eligibilitySummary.uncoveredBlockCount}</strong>
            <span>Currently uncovered blocks</span>
          </article>
          <article className="card stat-card">
            <strong>{basicSummary.assignmentCount}</strong>
            <span>Basic draft assignments</span>
          </article>
          <article className="card stat-card">
            <strong>{basicSummary.uncoveredBlockCount}</strong>
            <span>Basic draft open blocks</span>
          </article>
          <article className="card stat-card">
            <strong>{basicResult.status}</strong>
            <span>Basic assignment status</span>
          </article>
        </div>
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
