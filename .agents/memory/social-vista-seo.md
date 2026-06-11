---
name: Social Vista SEO approach
description: How per-route SEO/meta/JSON-LD is handled in the Social Vista SPA, and why no SSR.
---

# Social Vista SEO

Per-route SEO is done client-side via a `useSEO` hook (`src/hooks/use-seo.ts`) that imperatively sets `document.title`, meta (description/keywords/OG/Twitter), the canonical `<link>`, and a single `<script id="seo-jsonld">` JSON-LD block in a `useEffect`. The hook removes the JSON-LD on unmount so structured data does not leak onto routes without the hook (admin/not-found).

`index.html` carries strong **static** defaults (title, description, keywords, OG/Twitter incl. `og:image=/opengraph.jpg`, theme-color, canonical). Vite rewrites root-absolute `href`/`src` in index.html with the build base, so leading-slash asset paths are fine there.

Pages using the hook: Home (Organization + WebSite + FAQPage schema, plus an FAQ section built with native `<details>` + Tailwind `group-open:`), Services, ServiceDetail (Service + BreadcrumbList, dynamic title/description from `serviceContent`), Contact.

**Why no SSR/prerender:** it's a Vite SPA deployed on Railway. Full SSR is a large architectural change out of scope. Trade-off accepted: non-JS social crawlers see only the static index.html defaults (still valid site-wide previews); Googlebot renders JS and picks up per-route tags.

**How to apply:** build absolute URLs for canonical/JSON-LD as `window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "")` (call it `siteUrl`) so they stay correct under subpath deploys (Replit preview is under `/social-vista/`, Railway is root). Canonical from `window.location.pathname` is already base-correct. If true per-route crawler SEO is ever required, that's when to add prerendering.
