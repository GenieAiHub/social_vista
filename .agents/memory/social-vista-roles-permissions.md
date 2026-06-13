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

## Email composer / template parity

Lead reply emails use 5 themed templates. The client preview (`src/lib/email-templates.ts` `renderPreview`) **mirrors** the server renderer (`api-server/src/lib/email.ts` `renderLeadTemplate`) — theme palettes and HTML structure must stay in sync or the WYSIWYG preview lies. Both escape dynamic content; the preview iframe is `sandbox=""`.
