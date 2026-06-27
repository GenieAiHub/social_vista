---
name: Social Vista roles & permissions
description: How the staff roles/permissions model is enforced and where the trust boundary sits.
---

# Roles & permissions model

Staff get lead capabilities from an optional custom **role** (`staff.roleId` → `roles` table with 6 booleans: canView/Create/Edit/Delete/Assign/EmailLeads). Owners bypass roles entirely.

**Trust boundary is the server.** `resolvePermissions()` in `auth.ts` always grants owners all six; staff resolve from their role row with a view-only fallback. `requirePermission(flag)` gates each lead route; PATCH `/admin/leads/:id` splits assignment (`canAssignLeads`) from edits (`canEditLeads`). Client gating (`hasPermission` in `admin-auth.ts`, owners short-circuit true) is **UX only** — never the security control.

**Why:** client permissions come from the login/`/admin/me` payload and can be stale; only the server re-checks per request.

**How to apply:**
- Adding a new lead action → gate the route with `requirePermission` first, then mirror with `hasPermission` in the UI.
- `staff.roleId` is validated against an existing role on create/update (`roleIdIsValid`); deleting a role nulls dependent `staff.roleId` first.

## Gate READ endpoints too, not just mutations

The flag set grew beyond leads: `canManageBlog` and `canManageSEO` exist. When a permission gates an admin surface, **every** `/admin/*` route for it — including the GET list/read endpoints — must carry `requirePermission`, not only the create/update/delete ones. `GET /admin/blog` once had only `requireAuth`, which let any logged-in staff read unpublished drafts even without `canManageBlog`. The route-level `PermissionGuard` in the SPA is UX only; it does not protect the API.

**Why:** admin list endpoints return unpublished/internal data, so a missing read-side check is a real broken-access-control bug, not just a cosmetic gap.

## Public blog HTML is sanitized (non-owner authors)

Now that non-owner staff can author posts, the public render at `BlogPost.tsx` runs stored TipTap HTML through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`. The TipTap editor won't emit scripts, but `content` is a raw HTML string the API accepts directly, so a staff author could POST a stored-XSS payload. Keep the sanitize call on any public surface that renders post `content`.

## Email composer / template parity

Lead reply emails use 5 themed templates. The client preview (`src/lib/email-templates.ts` `renderPreview`) **mirrors** the server renderer (`api-server/src/lib/email.ts` `renderLeadTemplate`) — theme palettes and HTML structure must stay in sync or the WYSIWYG preview lies. Both escape dynamic content; the preview iframe is `sandbox=""`.
