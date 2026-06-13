# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
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

- Deploy: prod runs on Railway (auto-deploy from GitHub) against Neon Postgres; dev uses Replit Postgres. Code changes only reach prod after pushing to GitHub.
- After seeding/importing rows into the Neon prod DB, resync serial sequences (`SELECT setval(...)`) or inserts will collide on duplicate ids.
- Set `ADMIN_USERNAME`/`ADMIN_PASSWORD` in prod before first deploy, or change the seeded owner password immediately after first login.
- Email: set `RESEND_API_KEY` (and `RESEND_FROM_EMAIL` on a Resend-verified domain) in prod for live sending. Without a verified domain, Resend only delivers to your own account email via the `onboarding@resend.dev` sender. Without the key, all sends are silently skipped (logged).
- Email images: uploaded composer images are stored in the `email_assets` table (base64) and served by the public `GET /api/email-assets/:id` route — NOT object storage (unavailable on Railway). Outbound email `<img>` URLs must be absolute; the reply route prefers `PUBLIC_APP_URL` and falls back to the request host. Set `PUBLIC_APP_URL` (e.g. `https://yourdomain.com`) in prod so email images resolve to a canonical, non-spoofable origin.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
