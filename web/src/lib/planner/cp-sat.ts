import { spawn } from "node:child_process";
import path from "node:path";
import { buildBlockEligibility } from "@/lib/planner/eligibility";
import type { NormalizedPlannerInput } from "@/lib/planner/types";
import type { SolverRunInput, SolverRunResult } from "@/lib/planner/solve";

export async function runCpSatAssignment(
  plannerInput: NormalizedPlannerInput,
  solverInput: SolverRunInput,
  timeLimitSeconds = 15,
): Promise<SolverRunResult> {
  const payload = {
    employees: solverInput.employees,
    demandBlocks: solverInput.demandBlocks,
    eligibility: buildBlockEligibility(plannerInput, solverInput),
    constraints: solverInput.constraints,
    timeLimitSeconds,
  };

  const scriptPath = path.join(process.cwd(), "python", "solver_cp_sat.py");

  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `CP-SAT solver exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as SolverRunResult);
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
