# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `docker compose up -d --build` — run the self-hosted prod stack (local Postgres + migrate + app) on the VPS; the app joins the shared `web` network and is fronted by the server's existing shared Caddy
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema (source of truth): `lib/db/src/schema/*` (e.g. `staff.ts`, `leads.ts`, `contacts.ts`, `services.ts`), re-exported from `lib/db/src/schema/index.ts`
- API contract (source of truth): `lib/api-spec/openapi.yaml` → codegen produces `@workspace/api-client-react` (React Query hooks) and `@workspace/api-zod` (Zod schemas)
- Server routes: `artifacts/api-server/src/routes/*`, registered in `routes/index.ts`
- Auth helpers + middleware: `artifacts/api-server/src/lib/auth.ts`
- Client admin auth (token + user storage): `artifacts/social-vista/src/lib/admin-auth.ts`
- Admin pages: `artifacts/social-vista/src/pages/admin/*`; route wiring + auth guards in `artifacts/social-vista/src/App.tsx`

## Architecture decisions

- Contract-first: edit `openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`, then wire server (Zod-validated) and client (generated hooks). Do not hand-write API types.
- Auth is JWT (HS256, signed with `SESSION_SECRET`, 7-day TTL). `requireAuth` revalidates the staff row against the DB on every request (existence + `active`) so deactivated/deleted/demoted accounts lose access immediately rather than at token expiry. `requireOwner` reads the DB-backed role.
- Roles: `owner` (full access incl. staff management) and `staff`. The system protects against removing the last active owner (demote/deactivate/delete).
- Lead capture has two sources: the AI chat assistant (Groq tool-calling `save_consultation_lead`, two-pass completion) and the public contact form (mirrored to a lead with `source=contact`).
- Transactional email runs through Resend (`artifacts/api-server/src/lib/email.ts`). The client is lazily created from `RESEND_API_KEY`; when the key is absent every send is a logged no-op so the app still works in dev. Triggers: contact-form auto-reply + optional internal new-lead notification (contact route), status-transition emails on `PATCH /admin/leads/:id` (a "we received your inquiry" note on `new→contacted`, an appointment confirmation on `→booked`), and a custom admin reply via `POST /admin/leads/:id/reply` (composed in the Leads admin). Fire-and-forget automations never block their request; the explicit admin reply is synchronous and returns `502` if delivery fails so staff know it didn't send. Sender defaults to `Social Vista <onboarding@resend.dev>` and is overridable via `RESEND_FROM_EMAIL`; internal notifications only fire when `AGENCY_NOTIFICATION_EMAIL` is set. Dynamic content in email HTML is escaped.
- First-run bootstrap: `seedOwner()` creates an owner from `ADMIN_USERNAME`/`ADMIN_PASSWORD` (defaults `admin`/`socialvista2024`) only when no staff exist; logs a warning when defaults are used.

## Product

Social Vista is a social media agency website with a public marketing site (services, AI chat assistant "Powered by GNX AI") and an admin portal. Admins manage services, site content, theme, contact inquiries, and leads. Leads are captured automatically from the AI chat and contact form, then triaged in the admin (status, source filter, staff assignment, internal notes). Owners additionally manage staff accounts (create, role, activate/deactivate, password reset).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Deploy: prod is self-hosted on a VPS (IP 79.143.186.46) via Docker Compose — local Postgres (`db`), a one-shot `migrate`, and the `app`. There is NO dedicated Caddy in this stack: the server already runs a single SHARED reverse proxy (`reverse-proxy-caddy-1`, plain `caddy:2-alpine`) that owns 80/443 and fronts every project on the box. Our `app` joins the external `web` network under the alias `socialvista-web`, and a site block in the shared Caddyfile reverse-proxies to `socialvista-web:5000`. Domain `socialvista.co.in` (+ `www`) is on Cloudflare, proxied (orange cloud) with SSL mode Full (strict). Files: `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`. Dev still uses Replit Postgres. (Legacy: previously Railway + Neon; an earlier dedicated-Caddy/DNS-01 plan was dropped once we found the shared proxy.)
- TLS: the shared Caddy has NO `caddy-dns/cloudflare` plugin, so DNS-01/Let's Encrypt can't be used behind the orange cloud. Each site instead serves a Cloudflare Origin Certificate pinned via an explicit `tls /etc/caddy/certs/<name>/origin.pem /etc/caddy/certs/<name>/origin.key` line (ACME disabled). For Social Vista: create a CF Origin Cert for `socialvista.co.in` + `*.socialvista.co.in`, drop it at `<reverse-proxy-dir>/certs/socialvista/origin.pem` + `origin.key` (that dir is mounted read-only at `/etc/caddy/certs`), add the site block, then reload the proxy (`docker compose up -d` in the reverse-proxy dir, or `docker exec reverse-proxy-caddy-1 caddy reload --config /etc/caddy/Caddyfile`). The shared Caddyfile lives at `/root/agentopia/deploy/reverse-proxy/Caddyfile` (despite the folder name it's the server-wide shared proxy, not the agentopia app). `CLOUDFLARE_API_TOKEN` (Zone:DNS:Edit + Zone:Zone:Read) is still used for managing DNS records, not for TLS.
- DB on VPS: a one-shot compose `migrate` service runs `drizzle-kit push` against the local Postgres before `app` starts. No SQL migration files exist (push-based). The schema needs no SSL config; `lib/db` reads `DATABASE_URL` generically (local DB = no SSL, Neon required SSL via its URL). The local DB image is `postgres:18-alpine` to MATCH the source Neon server (PostgreSQL 18) — a major-version match is required to dump/restore the data and because PG won't start on a data dir from a different major version. If migrating from Neon: do NOT use `pg_dump --clean --if-exists` into the already-migrated local schema — its DROP ordering fails on the `staff` primary key that `tasks`/`email_assets` FKs depend on (would need CASCADE), and `ON_ERROR_STOP` then aborts. Instead drop & recreate the app DB empty (`DROP DATABASE ... WITH (FORCE); CREATE DATABASE ...`) and restore a plain full `pg_dump` (no `--clean`) into it (run pg_dump with a tool >= the Neon server version; the v18 db container's own `pg_dump` works). A full dump carries sequence values, so no manual `setval` resync is needed (unlike piecemeal row copies).
- After seeding/importing rows into a prod DB, resync serial sequences (`SELECT setval(...)`) or inserts will collide on duplicate ids.
- Set `ADMIN_USERNAME`/`ADMIN_PASSWORD` in prod before first deploy, or change the seeded owner password immediately after first login.
- Email: set `RESEND_API_KEY` (and `RESEND_FROM_EMAIL` on a Resend-verified domain) in prod for live sending. Without a verified domain, Resend only delivers to your own account email via the `onboarding@resend.dev` sender. Without the key, all sends are silently skipped (logged).
- Email images: uploaded composer images are stored in the `email_assets` table (base64) and served by the public `GET /api/email-assets/:id` route — NOT object storage (unavailable on Railway). Outbound email `<img>` URLs must be absolute; the reply route prefers `PUBLIC_APP_URL` and falls back to the request host. Set `PUBLIC_APP_URL` (e.g. `https://yourdomain.com`) in prod so email images resolve to a canonical, non-spoofable origin.
- Email image retention: uploaded images that are never sent (staff removes them before sending, or abandons the composer) would otherwise bloat the DB forever. Each `email_assets` row has a `used_at` timestamp set when a reply that embeds it is successfully sent. A background sweep in the API server (`lib/email-assets.ts`, started from `index.ts`, runs ~30s after boot then every 6h) deletes rows where `used_at IS NULL AND created_at` is older than `EMAIL_ASSET_RETENTION_DAYS` (7 days). Sent (used) assets are kept indefinitely because recipients' email clients fetch them by URL long after delivery. The sweep runs in whichever environment the server runs in (dev: Replit Postgres; prod: Neon).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
