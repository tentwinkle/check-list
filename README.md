# My Inspection System

This is a Next.js application for managing inspection checklists. It uses Prisma for database access and Supabase for file storage.

## Prerequisites

- **Node.js** - Recommended version 18 or later.
- **PostgreSQL** - Used as the main database.

Ensure `pnpm` is installed globally to run the provided commands.

## Environment Variables

Copy `.env.example` to `.env` and adjust the values for your environment.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string for the PostgreSQL database |
| `NEXTAUTH_URL` | Base URL of the Next.js app |
| `NEXTAUTH_SECRET` | Secret used by NextAuth for session signing |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | Default From address for emails |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Development

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

### Prisma database migrations

Generate and apply migrations locally:

```bash
pnpm db:generate
```

Deploy migrations in production:

```bash
pnpm db:migrate
```

Run the Prisma Studio GUI:

```bash
pnpm db:studio
```

## Testing

There is currently no automated test suite. If you add tests in the future, you can include a `test` script in `package.json` and run it with `pnpm test`.

## Building for production

To create an optimized build:

```bash
pnpm build
```

Start the application using:

```bash
pnpm start
```
