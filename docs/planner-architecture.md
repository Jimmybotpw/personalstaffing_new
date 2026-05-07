# Planner Architecture Recommendation

## Core decision
Use **Python + OR-Tools CP-SAT** for the scheduling engine.

Reason:
- matches the old prototype's strongest technical choice
- fits rule-heavy workforce planning very well
- handles hard + soft constraints cleanly
- easier to reason about than heuristic-only approaches

## Architecture shape
Do **not** build the new planner as one giant solver file.

Use layers instead.

## Proposed components

### 1. Planning input loader
Purpose:
- read the requested planning period
- load gym-scoped employees, areas, opening hours, vacations, availability, qualifications, rules, and fixed items

Input source:
- PostgreSQL via Prisma / app backend

Output:
- raw application records for a planning run

### 2. Normalizer
Purpose:
- convert app records into a clean planner domain model
- resolve IDs and references
- validate required fields
- convert time values into normalized minute/grid representations

Output examples:
- `PlannerEmployee`
- `PlannerArea`
- `PlannerDemand`
- `PlannerConstraintConfig`

### 3. Demand / shift generator
Purpose:
- generate schedulable work units from opening hours, area requirements, and course/fixed commitments
- decide whether the planner operates on slots, merged shifts, or hybrid demand blocks

Recommendation:
- start with grid-based demand blocks because that matches the old prototype and is easier to verify

### 4. CP-SAT model builder
Purpose:
- create decision variables
- add hard constraints
- add soft penalties/objective terms

Structure recommendation:
- `add_coverage_constraints(...)`
- `add_overlap_constraints(...)`
- `add_qualification_constraints(...)`
- `add_rest_constraints(...)`
- `add_hours_constraints(...)`
- `add_fairness_objective(...)`
- `add_shift_quality_objective(...)`

### 5. Solver runner
Purpose:
- run CP-SAT with controlled time limits
- store solver status and metadata
- capture infeasible / partial / best-found outcomes

### 6. Result translator
Purpose:
- convert the selected assignment variables into app schedule records
- return open shifts, warnings, and quality metrics

### 7. Schedule persistence + review
Purpose:
- store generated shifts and assignments in app tables
- support review UI and later manual locking / reruns

## Recommended implementation phases

### Phase 1: Feasibility-first planner
Implement first:
- coverage
- qualification matching
- no overlap
- vacations / absences
- fixed times
- weekly max hours
- minimum rest
- opening/closing permissions

Goal:
- produce valid schedules reliably

### Phase 2: Quality optimization
Add:
- target-hours balancing
- weekend fairness
- fewer area switches
- fewer split/fragmented assignments
- fewer open shifts

### Phase 3: Interactive planner workflow
Add later:
- locked assignments
- partial reruns
- explanation/warning output
- manual adjustment support

## Service boundary recommendation
Short term:
- keep planner code inside the repo, but outside Next.js page code
- call it through a backend execution path

Medium term:
- extract to a dedicated scheduler worker/service if generation becomes heavier

## Folder recommendation
A clean start could look like this:

- `planner/`
  - `domain/`
  - `normalize/`
  - `generate/`
  - `constraints/`
  - `solve/`
  - `translate/`
- `web/`
  - UI + auth + CRUD + orchestration
- `docs/`
  - planner rules + architecture notes

## Final recommendation
Rebuild the planner deliberately:
- same solver family as the prototype
- much cleaner architecture
- hard constraints first
- soft quality optimization second
