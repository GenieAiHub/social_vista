---
name: Lead activities timeline
description: How the per-lead activity/interaction timeline is recorded and surfaced
---

Leads have a chronological interaction timeline backed by a `lead_activities` table (FK `lead_id` ON DELETE CASCADE, so deleting a lead removes its activities; nullable `author_id` ON DELETE SET NULL plus a denormalized `author_name` snapshot so the log survives staff deletion).

**Auto-logged events** are appended server-side inside the existing lead routes (not a separate service): lead creation ("created"), status change, assignment change, internal-note save (PATCH /admin/leads/:id), explicit mark-contacted, and email reply (POST .../reply). Timeline writes are wrapped in try/catch and must never break the underlying lead operation. The "created" event fires at every capture point (manual admin create in leads.ts, contact form in contact.ts, AI chat in chat.ts); `logActivity` and `createdNoteForSource(source)` are exported from leads.ts and reused by contact.ts/chat.ts (which now `.returning()` the inserted lead). Note text comes from `createdNoteForSource` keyed by source.

**API:** `GET/POST /admin/leads/:id/activities` (newest-first). POST is for manual log entries from staff. Author is taken from `req.staff` (AuthedRequest).

**Why denormalized author_name:** staff rows can be deleted/deactivated; the timeline should still show who did what historically.

**How to apply:** when adding a new lead mutation that staff care about, append a matching activity row using the same in-route logging pattern, and pick a `type` string that has an entry in the frontend `activityMeta` map (defined in BOTH LeadsAdmin.tsx and Dashboard.tsx — keep them in sync, else the type falls back to the generic "log" icon).

**Cross-lead feed:** `GET /admin/activities?limit=N` (default 15) inner-joins activities to leads for a `leadName` and powers the dashboard "Recent Activity" card. Schema is `RecentActivity` in openapi. Clicking a feed row deep-links to `/admin/leads?lead=<id>`; LeadsAdmin reads that param via wouter `useSearch`, then highlights (ring), auto-expands the timeline, and scrolls the matching LeadCard into view. Note: a deep-linked lead hidden by active status/source filters won't render (default filters are "all").
