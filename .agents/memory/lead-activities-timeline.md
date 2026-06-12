---
name: Lead activities timeline
description: How the per-lead activity/interaction timeline is recorded and surfaced
---

Leads have a chronological interaction timeline backed by a `lead_activities` table (FK `lead_id` ON DELETE CASCADE, so deleting a lead removes its activities; nullable `author_id` ON DELETE SET NULL plus a denormalized `author_name` snapshot so the log survives staff deletion).

**Auto-logged events** are appended server-side inside the existing lead routes (not a separate service): status change, assignment change, internal-note save (PATCH /admin/leads/:id), explicit mark-contacted, and email reply (POST .../reply). Timeline writes are wrapped in try/catch and must never break the underlying lead operation.

**API:** `GET/POST /admin/leads/:id/activities` (newest-first). POST is for manual log entries from staff. Author is taken from `req.staff` (AuthedRequest).

**Why denormalized author_name:** staff rows can be deleted/deactivated; the timeline should still show who did what historically.

**How to apply:** when adding a new lead mutation that staff care about, append a matching activity row using the same in-route logging pattern, and pick a `type` string that has an entry in the frontend `activityMeta` map in LeadsAdmin.tsx (else it falls back to the generic "log" icon).
