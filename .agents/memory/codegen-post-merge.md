---
name: Codegen staleness after task merges
description: Why merged tasks that touch openapi.yaml can break the frontend bundle, and how it's prevented.
---

# Codegen staleness after task merges

If the frontend fails with errors like `Module '@workspace/api-client-react' has no exported member 'X'` or `Property 'Y' does not exist on type 'Lead'` after one or more tasks merge, the generated client/zod packages are stale relative to `lib/api-spec/openapi.yaml`.

**Fix:** run `pnpm --filter @workspace/api-spec run codegen` (regenerates `@workspace/api-client-react` + `@workspace/api-zod` and runs `typecheck:libs`), then restart the `social-vista` web workflow to drop the broken Vite bundle.

**Why:** isolated task agents regenerate codegen in their own envs, but merge resolution can drop the regenerated output, leaving the spec ahead of the generated code. A TS error does not stop Vite from serving, but a missing ESM export breaks the admin bundle at runtime — which surfaces as seemingly-unrelated symptoms (e.g. "can't log in").

**How it's prevented:** `scripts/post-merge.sh` runs codegen after every merge (after `pnpm install` + `db push`). If you add steps there, keep codegen last and confirm `runPostMergeSetup()` stays within the configured timeout.

## ⚠️ Spec is BEHIND the generated code for blog + permissions

The blog endpoints/`BlogPost` schemas and the `canManageBlog` / `canManageSEO` permission fields were **hand-added directly to the generated `@workspace/api-client-react` + `@workspace/api-zod` files and are NOT in `lib/api-spec/openapi.yaml`**. So the usual "fix = run codegen" advice is **inverted** for these: running full codegen right now would silently **delete** the blog hooks/types and drop the two permission flags, breaking the admin blog UI and role editor.

**Before ever running codegen** (manually or via post-merge), first add blog paths + `BlogPost` schema and the two permission booleans to `openapi.yaml`, or the regeneration will regress these features. Until the spec is reconciled, keep hand-editing the generated files to add blog/permission shape.

**Why:** the established pattern in this repo became hand-editing generated output, and the spec was never backfilled when the blog system + new permissions landed.
