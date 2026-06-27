---
name: Social Vista site map
description: Public routes, navigation structure, and where each page's content lives.
---

# Social Vista site map

Public routes (wouter, in `App.tsx`): `/` (Home), `/about`, `/services`, `/services/:slug`, `/blog`, `/blog/:slug`, `/pricing`, `/faq`, `/contact`, plus `/admin/*`.

Desktop nav order (matches the SEOC reference the user supplied): Home, Services (mega menu, DB-driven), About, Blog, Pages dropdown (Pricing + FAQ), Contact Us, and a "Free Consultation" button. Mobile menu mirrors this.

**Content locations:**
- Blog posts are now DB-driven (`blog_posts` table). Public pages (`Blog.tsx`, `BlogPost.tsx`) fetch via `useListBlogPosts` / `useGetBlogPost` hooks. Admin UI at `/admin/blog` (requires `canManageBlog` permission) uses TipTap rich editor; static posts were seeded on first startup via `seedBlogPosts()` in `routes/blog.ts`. `lib/blog-content.ts` is now unused but kept for reference.
- Pricing tiers and FAQ items are hardcoded inside `pages/Pricing.tsx` and `pages/FAQ.tsx`.
- Home hero uses a static illustration `src/assets/hero-team.png` (the user's attached analytics image), NOT an animated component. An earlier animated `HeroOrbit` component was removed because it wasn't rendering for the user on the live site — prefer a plain `<img>` for the hero.

**Conventions to keep:** every page wraps content in `<Navbar/>` + `<Footer/>`, calls `useSEO(...)` (see `hooks/use-seo.ts`), and uses the shared theme classes (`text-gradient`, `card-soft`, `bg-gradient-brand`, `glow-primary`, `.blob`, `grid-bg`). Dropdown panels are CSS hover menus; they also reveal on keyboard focus via `group-focus-within:` and the Pages trigger is a real `<button>` for keyboard access.

**Deploy:** site is on Railway via GitHub auto-build. Changes in Replit are NOT live until the user pushes to GitHub — always remind them.
