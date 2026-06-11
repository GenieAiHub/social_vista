import { useState, useEffect } from "react";
import { Save, FileText, RefreshCw } from "lucide-react";
import { useGetContent, useUpsertContent, getGetContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const keyLabels: Record<string, string> = {
  hero_headline: "Hero Headline",
  hero_subheadline: "Hero Subheadline",
  about_heading: "About Section Heading",
  about_body: "About Section Body",
  cta_primary: "Primary CTA Button Text",
  cta_secondary: "Secondary CTA Button Text",
};

export default function ContentAdmin() {
  const { data: content, isLoading } = useGetContent();
  const upsertContent = useUpsertContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (content) {
      const initial: Record<string, string> = {};
      content.forEach(b => { initial[b.key] = b.value; });
      setEdits(initial);
    }
  }, [content]);

  function handleSave(key: string) {
    setSaving(prev => ({ ...prev, [key]: true }));
    upsertContent.mutate(
      { data: { key, value: edits[key] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey() });
          toast({ title: "Content saved successfully." });
        },
        onError: () => toast({ title: "Failed to save. Please try again.", variant: "destructive" }),
        onSettled: () => setSaving(prev => ({ ...prev, [key]: false })),
      }
    );
  }

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  function handleAddNew() {
    if (!newKey.trim() || !newValue.trim()) return;
    upsertContent.mutate(
      { data: { key: newKey.trim(), value: newValue.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey() });
          toast({ title: "New content block added." });
          setNewKey(""); setNewValue("");
        },
        onError: () => toast({ title: "Failed to add block.", variant: "destructive" }),
      }
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Content Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit site content blocks. Changes are saved individually.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {content?.map((block) => {
              const label = keyLabels[block.key] ?? block.key;
              const isLong = (edits[block.key] ?? "").length > 80 || block.key.includes("body") || block.key.includes("sub");
              return (
                <div key={block.id} className="bg-card rounded-xl border border-border p-5" data-testid={`block-content-${block.key}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm text-foreground">{label}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">{block.key}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-primary hover:bg-primary/90 text-white text-xs"
                      onClick={() => handleSave(block.key)}
                      disabled={saving[block.key] || edits[block.key] === block.value}
                      data-testid={`button-save-${block.key}`}
                    >
                      {saving[block.key] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" />Save</>}
                    </Button>
                  </div>
                  {isLong ? (
                    <Textarea
                      value={edits[block.key] ?? ""}
                      onChange={e => setEdits(prev => ({ ...prev, [block.key]: e.target.value }))}
                      className="bg-muted border-input resize-none text-sm"
                      rows={3}
                      data-testid={`textarea-content-${block.key}`}
                    />
                  ) : (
                    <Input
                      value={edits[block.key] ?? ""}
                      onChange={e => setEdits(prev => ({ ...prev, [block.key]: e.target.value }))}
                      className="bg-muted border-input text-sm"
                      data-testid={`input-content-${block.key}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add new block */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Add New Content Block</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Key (snake_case)</label>
              <Input
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. footer_tagline"
                className="bg-muted border-input text-sm font-mono"
                data-testid="input-new-content-key"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Value</label>
              <Input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Content value..."
                className="bg-muted border-input text-sm"
                data-testid="input-new-content-value"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white text-xs"
            onClick={handleAddNew}
            disabled={!newKey.trim() || !newValue.trim() || upsertContent.isPending}
            data-testid="button-add-content-block"
          >
            Add Block
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
