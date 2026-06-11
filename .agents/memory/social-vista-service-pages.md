---
name: Social Vista service pages
description: How per-service landing pages get their rich content (images, benefits, features).
---

The `services` DB table only has: id, title, description, icon, category, sortOrder, active. It has **no** slug, benefits, or image columns.

Per-service landing pages at `/services/:slug` get their rich content from a **frontend** map, not the DB:
- `src/lib/services-content.ts` exports `serviceContent` keyed by slug, plus `slugify()` and `iconMap`.
- The canonical slug is `slugify(service.title)` — the SAME function is used to build links and to look up the route param, so they always match. Don't hand-write slugs.
- Service illustrations live at `src/assets/services/<slug>.png` (light, flat, pink/purple). The hero is `src/assets/hero-illustration.png`.

**Why:** keeps the DB schema stable while allowing marketing-rich detail pages. Adding a new service means: insert the DB row, add a matching `serviceContent[slug]` entry, and drop in `assets/services/<slug>.png`.

**Theme:** site is a light/airy pink-magenta + purple theme (SEOC-inspired). Theme tokens live in `src/index.css` `:root`. Card hover util is `.card-soft` (was `.card-glow` in the old dark theme).
