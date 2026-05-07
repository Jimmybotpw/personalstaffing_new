# Planner Rules Extraction

## Recommendation
Keep **OR-Tools CP-SAT** as the planning engine, but rebuild the planner in clean layers instead of carrying over the monolithic prototype solver.

## Rules extracted from the old prototype

### Hard constraints
These should normally never be violated.

#### Coverage / staffing
- Each generated shift must meet `min_staff`.
- If `max_staff` is defined, assignments must not exceed it.
- Welcome Desk appears to have stricter max staffing than other areas.

#### Qualification / eligibility
- Employees may only work shifts in areas they are qualified for.
- Course shifts may require a specific primary employee.
- Non-substitutable courses must not be assigned to others.

#### Time conflicts
- One employee cannot be assigned to overlapping shifts.
- Employee assignments are evaluated on a discrete planning grid.

#### Availability blockers
- Vacation periods block assignment.
- Fixed times restrict assignment to matching windows only.
- Weekend-ineligible employees cannot work weekend shifts.
- Opening/closing desk shifts require `open_close_service` permission.

#### Time and labor rules
- Weekly working time must not exceed employee max hours.
- Minimum rest time between work blocks must be respected.
- When split shifts are not allowed, work during a day should remain contiguous.

### Soft constraints
These are desirable optimization goals rather than absolute rules.

#### Fairness and balance
- Balance weekend burden across employees and across weeks.
- Keep employees reasonably close to target hours.
- Avoid assigning the same people to undesirable patterns repeatedly.

#### Shift quality
- Prefer longer coherent work blocks over fragmented mini-assignments.
- Avoid unnecessary area switches within a day.
- Prefer smoother day structures around courses and operational coverage.

#### Planner preferences
- Discourage split shifts unless explicitly allowed.
- Prefer schedules with fewer open slots / dummy coverage.

## Prototype-specific artifacts to avoid copying directly
- Loading live data from file-based classes inside the solver
- One very large file mixing domain logic, data loading, slot generation, constraints, optimization, and export
- Implicit rules hidden in ad-hoc condition blocks
- Repeated helper calls into old area-loading logic during solving

## Recommended migration order
1. Recreate the domain inputs cleanly in the web app
2. Normalize input into planner-ready structures
3. Re-implement hard constraints first
4. Add soft penalties second
5. Add schedule quality improvements and repair workflows later
