# Inspection System

This project uses Prisma and Next.js. Database schema migrations live in `prisma/migrations` and are applied using `prisma migrate dev`.

## Recent Migration

- Added an index on `InspectionInstance(status, dueDate)` to speed up lookups.

Run `pnpm exec prisma migrate dev` to apply new migrations during development.
