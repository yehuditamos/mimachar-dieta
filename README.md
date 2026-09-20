# ממחר דיאטה

Independent mobile-first Hebrew RTL Next.js application. No ChatGPT account required.

Four members create/join a group by invite, agree unanimously on 30/60/90 days, set private personal weight goals and activity targets, and start tomorrow together.

## Deployment status
Source prepared and local build/tests passed. External deployment, database migration, email delivery and live four-user verification are not complete yet.

## Deploy on Vercel
Import this repository as a Next.js project. Keep root directory at repository root. Use the pinned pnpm version and lockfile.

Set server-only environment variables: DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET (random 32+ bytes), APP_ORIGIN (final HTTPS production origin without trailing slash). Never prefix these keys with NEXT_PUBLIC or commit their values.

Apply db/migrations/001_groups.sql to your dedicated Postgres database and register the production origin in Neon Auth trusted domains. Redeploy after changing environment variables.

Commands: pnpm install --frozen-lockfile; pnpm test; pnpm typecheck; pnpm build.

Tests cover real group route logic with mocked storage and identity; they do not prove live database/email integration. Verify four separate email accounts, private goal visibility, unanimous votes, fifth-member rejection and owner-only start before inviting participants. Configure your own email provider before a wider launch.
