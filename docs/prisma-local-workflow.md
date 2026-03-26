# Prisma Local Workflow

This repo currently has historical migration drift around:

- `prisma/migrations/20260313164222_add_product_variants_availablity`

That applied migration has to stay intact for history consistency, but it is not safe to rely on
`prisma migrate dev` against a shared database for day-to-day local testing.

## Safe local setup

1. Keep the shared/project secrets in `.env`.
2. Copy `.env.local.example` to `.env.local`.
3. Set `DATABASE_URL` in `.env.local` to a local Postgres database.

`.env.local` overrides `.env` for local app runtime, and the wrapper scripts below also load it
before invoking Prisma CLI.

## Commands

- `npm run prisma:local:generate`
- `npm run prisma:local:db:push`
- `npm run prisma:local:studio`
- `npm run prisma:local:validate`

## Recommended local test flow

1. Start a local Postgres database.
2. Put that local connection string in `.env.local`.
3. Run `npm run prisma:local:db:push`.
4. Run `npm run prisma:local:generate`.
5. Start the app with `npm run dev`.

This bypasses migration-history replay and pushes the current schema directly into your local test
database, which is the safest way to test current application changes without resetting shared data.

## Important

- Do not run `prisma migrate dev` against the shared Supabase database.
- Do not delete or rewrite applied migration files to make local drift disappear.
- Use `db push` only for local/dev-only databases.
