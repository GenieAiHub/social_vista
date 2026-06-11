export type ThemeId = "rose" | "ocean" | "sunset";

export const THEME_CONTENT_KEY = "site_theme";

export const DEFAULT_THEME: ThemeId = "rose";

const STORAGE_KEY = "sv_theme";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  /** Swatch colors for previews (CSS color values). */
  primary: string;
  accent: string;
  soft: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "rose",
    name: "Rose Magenta",
    description: "Vivid pink & purple — bold and energetic.",
    primary: "hsl(335 85% 55%)",
    accent: "hsl(265 70% 60%)",
    soft: "hsl(340 100% 97%)",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Cool blue & cyan — clean and trustworthy.",
    primary: "hsl(212 90% 50%)",
    accent: "hsl(190 85% 45%)",
    soft: "hsl(210 100% 96.5%)",
  },
  {
    id: "sunset",
    name: "Sunset Amber",
    description: "Warm coral & amber — friendly and vibrant.",
    primary: "hsl(14 88% 55%)",
    accent: "hsl(38 92% 52%)",
    soft: "hsl(24 100% 96%)",
  },
];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === "rose" || value === "ocean" || value === "sunset";
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function getStoredTheme(): ThemeId {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

export function setStoredTheme(theme: ThemeId): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
}
