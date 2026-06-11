---
name: Social Vista color themes
description: How the selectable site-wide color themes work and where they're defined
---

# Social Vista color themes

Three selectable site-wide palettes (rose [default], ocean, sunset). Admin picks one at `/admin/theme`.

- Theme defs + helpers live in `src/lib/theme.ts` (THEMES, applyTheme, getStoredTheme/setStoredTheme, isThemeId, DEFAULT_THEME, THEME_CONTENT_KEY="site_theme").
- Persistence reuses the existing `content_blocks` key/value table via the content API (key=`site_theme`). **No DB/API/OpenAPI changes were needed** — themes are just another content block.
- Application: `applyTheme` sets `data-theme` on `<html>`. `index.css` has `:root[data-theme="ocean"]` / `[data-theme="sunset"]` blocks that override the CSS vars (`--primary`, `--accent`, gradients, glow, card-hover). Tailwind 4 `@theme inline` consumes `hsl(var(--primary))` at use-site, so overriding the vars cascades to all utility classes.
- No-flash: `main.tsx` applies `getStoredTheme()` (localStorage) synchronously before render; `ThemeApplier` (mounted inside the wouter Router in App.tsx) then syncs from the server content block.

**Why `ThemeApplier` skips `/admin/theme`:** ThemeAdmin live-previews the highlighted (unsaved) theme by mutating `data-theme`. If ThemeApplier ran there, a background `useGetContent` refetch would clobber the preview back to the saved value. So ThemeApplier early-returns when `location === "/admin/theme"`.

**How to add a 4th theme:** add an entry to THEMES in `theme.ts` (id must be added to ThemeId union) and a matching `[data-theme="<id>"]` override block in `index.css`. The admin picker renders from THEMES automatically.
