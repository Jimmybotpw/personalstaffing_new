# Personal Staffing Rebuild Status

## What exists now
- legacy Python desktop prototype remains intact for reference
- new `web/` foundation added for the rebuild
- initial Docker + PostgreSQL setup added
- initial Prisma schema added
- architecture notes added in `docs/architecture.md`

## Immediate next steps
1. initialize Next.js app dependencies
2. add auth and user sessions
3. expand Prisma schema for constraints, availabilities, and assignments
4. define API contracts for schedule generation
5. port scheduler logic from Python prototype into a clean service layer

## Important note
The current web skeleton is a foundation, not yet a working product.
It exists to start the clean migration in a safe and scalable direction.
