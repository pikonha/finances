# Finances

Multi-user personal finance app built with TanStack Start, Better Auth, Drizzle/Postgres, TanStack Query, and shadcn/ui.

## Local setup

```bash
pnpm install
pnpm db:push
pnpm dev
```

Required environment variables:

```dotenv
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000
HERMES_WEBHOOK_SECRET=...
HERMES_USER_ID=better-auth-user-id-owned-by-hermes-writes
CRON_SECRET=...
```

`HERMES_USER_ID` is the Better Auth user ID assigned to external transaction writes. The webhook contract uses `account_id`; `card_id` is no longer accepted.

## Commands

- `pnpm dev` — local app
- `pnpm test` — unit tests
- `pnpm build` — production build
- `pnpm db:generate` — generate migration
- `pnpm db:push` — synchronize a development database
- `pnpm db:migrate` — apply generated migrations
- `pnpm start` — run `.output/server/index.mjs`

## Railway

Set all six environment variables above; use the public app URL for `BETTER_AUTH_URL`. Apply the migration before deploying. The database migration is destructive versus the old single-user/card schema.

The daily cron remains:

```text
0 0 * * *
sh -c "curl -fsS -X POST -H \"Authorization: Bearer $CRON_SECRET\" \"$APP_URL/api/cron/materialize-recurrence\""
```

The cron materializes rules for every user and remains idempotent. Installments are allowed only for expense transactions on an owned credit-card account.
