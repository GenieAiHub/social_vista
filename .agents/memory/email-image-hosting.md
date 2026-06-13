---
name: Email image hosting (Railway/Neon)
description: How lead-email images are stored/served and why object storage wasn't used; absolute-URL rule for outbound email.
---

# Email image hosting

Uploaded images for lead emails are stored as base64 in a Postgres table (`email_assets`)
and served by a **public, unauthenticated** API route (`GET /api/email-assets/:id`).

**Why not Replit object storage:** production runs on Railway against Neon Postgres.
Replit App/object storage depends on the Replit sidecar credentials, which don't exist
on Railway — so any object-storage approach would break in prod. A DB-backed asset table
+ public serving route is fully portable (works wherever the app + Postgres run).

**How to apply:**
- The serving route MUST stay unauthenticated — email clients fetch images by URL with no session.
- Outbound email image `<img src>` must be an **absolute** URL. The reply route converts the
  client's relative `/api/email-assets/:id` to absolute, preferring `PUBLIC_APP_URL` (canonical,
  set in prod) and only falling back to the request Host header (spoofable) when it's unset.
- Image URLs are validated to http(s) and HTML-escaped in BOTH the server renderer (`email.ts`)
  and the client preview (`email-templates.ts`) — keep those two in sync like the template themes.
- `email_assets` is a new table: like every schema change here, it must be applied manually to
  Neon prod (additive `CREATE TABLE IF NOT EXISTS …`) since Neon isn't Replit-managed.
