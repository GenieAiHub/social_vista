import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetContent } from "@workspace/api-client-react";
import { applyTheme, isThemeId, setStoredTheme, THEME_CONTENT_KEY, DEFAULT_THEME } from "@/lib/theme";

/**
 * Reads the admin-selected site theme from the content blocks and applies it
 * globally. Renders nothing. The last-known theme is also applied synchronously
 * in main.tsx to avoid a flash before this data loads.
 *
 * Skips the theme editor route (/admin/theme) so a background refetch can't
 * clobber the unsaved live preview managed by ThemeAdmin.
 */
export default function ThemeApplier() {
  const { data: content } = useGetContent();
  const [location] = useLocation();

  useEffect(() => {
    if (location === "/admin/theme") return;
    if (!content) return;
    const block = content.find((b) => b.key === THEME_CONTENT_KEY);
    const theme = isThemeId(block?.value) ? block!.value : DEFAULT_THEME;
    applyTheme(theme);
    setStoredTheme(theme);
  }, [content, location]);

  return null;
}
