import { useState, useEffect } from "react";
import { Check, Palette, RefreshCw } from "lucide-react";
import { useGetContent, useUpsertContent, getGetContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  THEMES,
  THEME_CONTENT_KEY,
  DEFAULT_THEME,
  isThemeId,
  applyTheme,
  setStoredTheme,
  type ThemeId,
} from "@/lib/theme";

export default function ThemeAdmin() {
  const { data: content, isLoading } = useGetContent();
  const upsertContent = useUpsertContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selected, setSelected] = useState<ThemeId>(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);

  const savedBlock = content?.find((b) => b.key === THEME_CONTENT_KEY);
  const savedTheme: ThemeId = isThemeId(savedBlock?.value) ? savedBlock!.value : DEFAULT_THEME;

  useEffect(() => {
    setSelected(savedTheme);
  }, [savedTheme]);

  // Live-preview the highlighted theme while in the admin.
  useEffect(() => {
    applyTheme(selected);
    return () => applyTheme(savedTheme);
  }, [selected, savedTheme]);

  function handleSave() {
    setSaving(true);
    upsertContent.mutate(
      { data: { key: THEME_CONTENT_KEY, value: selected } },
      {
        onSuccess: () => {
          setStoredTheme(selected);
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey() });
          toast({ title: "Theme updated. The whole site now uses this palette." });
        },
        onError: () => toast({ title: "Failed to save theme. Please try again.", variant: "destructive" }),
        onSettled: () => setSaving(false),
      },
    );
  }

  const dirty = selected !== savedTheme;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Color Theme
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Pick a color palette for the whole public website. Click a theme to preview it, then save to apply it for all visitors.
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleSave}
            disabled={!dirty || saving || isLoading}
            data-testid="button-save-theme"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Theme"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse h-56" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const active = selected === theme.id;
              const isCurrent = savedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelected(theme.id)}
                  aria-pressed={active}
                  aria-label={`${theme.name} theme${isCurrent ? " (currently live)" : ""}`}
                  className={`relative text-left bg-card rounded-2xl border-2 p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active ? "border-primary shadow-lg" : "border-border hover:border-primary/40"
                  }`}
                  data-testid={`theme-option-${theme.id}`}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}

                  {/* Swatch preview */}
                  <div className="rounded-xl overflow-hidden border border-border mb-4">
                    <div className="h-16 flex" style={{ background: theme.soft }}>
                      <div className="flex-1" style={{ background: `linear-gradient(120deg, ${theme.primary}, ${theme.accent})` }} />
                    </div>
                    <div className="flex">
                      <div className="h-6 flex-1" style={{ background: theme.primary }} />
                      <div className="h-6 flex-1" style={{ background: theme.accent }} />
                      <div className="h-6 flex-1" style={{ background: theme.soft }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{theme.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {dirty && (
          <p className="text-xs text-muted-foreground">
            Previewing <span className="font-semibold text-foreground">{THEMES.find((t) => t.id === selected)?.name}</span>. Save to make it live for visitors.
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
