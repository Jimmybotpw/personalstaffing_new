# Personal Staffing Web Rebuild

## Goal
Build a secure, scalable, Dockerized web application for staff planning.

## Product direction
- multi-user login
- one gym/workspace per account at first
- employees, areas, opening times, qualifications, vacations, constraints
- weekly/monthly schedule generation
- clearly visible unfilled shifts
- professional web UI instead of desktop app

## Reuse from current prototype
Keep and migrate:
- scheduling rules and constraint logic
- domain concepts: employees, areas, courses, vacations, fixed times
- OR-Tools / CP-SAT based planning knowledge

Replace:
- PyQt desktop UI
- local SQLite app structure
- file-driven workflow
- prototype packaging files

## Target architecture
- `web/` → Next.js app (frontend + API routes initially)
- PostgreSQL → main application database
- Prisma → schema and DB access
- Docker Compose → local/dev deployment
- later optional extracted scheduler worker service

## Security baseline
- hashed passwords
- tenant isolation by gym/workspace
- no secrets in repo
- HTTPS behind reverse proxy in deployment
- database not publicly exposed
- server-side validation on all write operations

## MVP modules
1. Auth
2. Workspace / gym setup
3. Employees
4. Areas and opening times
5. Constraints
6. Schedule generation
7. Schedule review with open shifts

## Migration strategy
1. Create clean web foundation
2. Model database properly
3. Rebuild CRUD flows
4. Port scheduling engine deliberately
5. Add generation + review UI
6. Dockerize and deploy
