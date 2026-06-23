import { useState, useEffect, useId } from "react";
import { Search, Save, RefreshCw, Globe, Info, Tag, Plus, Trash2, Code } from "lucide-react";
import { useGetContent, useUpsertContent, getGetContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseSEOBlock, type StoredSEO } from "@/hooks/use-seo";
import { parseCustomTags, type CustomMetaTag } from "@/components/CustomMetaInjector";

const PAGES = [
  {
    key: "home", label: "Home", path: "/",
    defaults: {
      title: "Social Vista — Digital Growth, Social Media & AI Marketing Agency",
      description: "Social Vista is a full-service digital agency. We help brands grow louder and convert faster with social media management, WhatsApp automation, content & influencer marketing, email marketing, SaaS and Web3 development.",
      keywords: "digital marketing agency, social media management, whatsapp chatbot, whatsapp marketing, content creation, influencer marketing, email marketing, saas development, web3 development, ai automation",
    },
  },
  {
    key: "about", label: "About", path: "/about",
    defaults: {
      title: "About Social Vista — Your Full-Service Digital Growth Partner",
      description: "Learn about Social Vista, a full-service digital agency combining creative strategy with AI-powered automation. Discover our mission, values, and the team driving brand growth worldwide.",
      keywords: "about social vista, digital marketing agency, our mission, agency values, growth partner, social media agency team",
    },
  },
  {
    key: "services", label: "Services", path: "/services",
    defaults: {
      title: "Our Services — Social Media, Automation & Development | Social Vista",
      description: "Explore Social Vista's full range of digital services: social media management, WhatsApp chatbots & campaigns, content & influencer marketing, email marketing, SaaS and Web3 development.",
      keywords: "digital agency services, social media management, whatsapp chatbot, whatsapp campaigns, content creation, influencer marketing, email marketing, saas development, web3 development",
    },
  },
  {
    key: "blog", label: "Blog", path: "/blog",
    defaults: {
      title: "Blog — Insights on Social Media, Automation & Digital Growth | Social Vista",
      description: "Practical insights on social media strategy, WhatsApp automation, AI in marketing, influencer marketing, and digital growth from the Social Vista team.",
      keywords: "digital marketing blog, social media tips, whatsapp automation, ai marketing, influencer marketing, growth strategy",
    },
  },
  {
    key: "pricing", label: "Pricing", path: "/pricing",
    defaults: {
      title: "Pricing — Custom Plans for Every Stage | Social Vista",
      description: "Flexible, custom pricing scoped to your goals and budget. Explore Social Vista's Starter, Growth, and Enterprise plans for social media, automation, and development.",
      keywords: "social media agency pricing, digital marketing packages, whatsapp automation pricing, agency plans, custom marketing quote",
    },
  },
  {
    key: "faq", label: "FAQ", path: "/faq",
    defaults: {
      title: "FAQ — Frequently Asked Questions | Social Vista",
      description: "Answers to common questions about Social Vista's services, pricing, onboarding, reporting, and how we help brands grow with social media, automation, and development.",
      keywords: "social vista faq, digital agency questions, pricing, onboarding, social media agency faq",
    },
  },
  {
    key: "contact", label: "Contact", path: "/contact",
    defaults: {
      title: "Contact Us — Get a Free Consultation | Social Vista",
      description: "Ready to grow? Contact Social Vista for a free consultation. Tell us about your project and our team will reply within 24 hours with a tailored proposal.",
      keywords: "contact social vista, free consultation, hire digital agency, marketing agency quote",
    },
  },
] as const;

type PageKey = (typeof PAGES)[number]["key"] | "custom_tags";

interface FormState {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalPath: string;
}

const EMPTY_FORM: FormState = { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "" };

const ATTR_OPTIONS: { value: CustomMetaTag["attr"]; label: string }[] = [
  { value: "name", label: "name" },
  { value: "property", label: "property" },
  { value: "http-equiv", label: "http-equiv" },
];

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function charCount(s: string, warn: number, max: number) {
  const len = s.length;
  if (len === 0) return null;
  const color = len > max ? "text-destructive" : len > warn ? "text-yellow-500" : "text-muted-foreground";
  return <span className={`text-xs ${color}`}>{len} chars</span>;
}

export default function SEOAdmin() {
  const { data: content, isLoading } = useGetContent();
  const upsertContent = useUpsertContent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeKey, setActiveKey] = useState<PageKey>("home");
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [saving, setSaving] = useState(false);

  // Custom tags state
  const [customTags, setCustomTags] = useState<CustomMetaTag[]>([]);
  const [savingCustom, setSavingCustom] = useState(false);

  // Initialise page forms from DB
  useEffect(() => {
    if (!content) return;
    const initial: Record<string, FormState> = {};
    for (const page of PAGES) {
      const block = content.find((b) => b.key === `seo:${page.key}`);
      const stored: StoredSEO = parseSEOBlock(block?.value);
      initial[page.key] = {
        title: stored.title ?? "",
        description: stored.description ?? "",
        keywords: stored.keywords ?? "",
        ogImage: stored.ogImage ?? "",
        canonicalPath: stored.canonicalPath ?? "",
      };
    }
    setForms(initial);
  }, [content]);

  // Initialise custom tags from DB
  useEffect(() => {
    if (!content) return;
    const block = content.find((b) => b.key === "seo:custom_tags");
    setCustomTags(parseCustomTags(block?.value));
  }, [content]);

  const activePage = PAGES.find((p) => p.key === activeKey);
  const form: FormState = forms[activeKey as string] ?? EMPTY_FORM;

  function updateField(field: keyof FormState, value: string) {
    setForms((prev) => ({ ...prev, [activeKey]: { ...(prev[activeKey] ?? EMPTY_FORM), [field]: value } }));
  }

  function getStored(pageKey: string): StoredSEO {
    return parseSEOBlock(content?.find((b) => b.key === `seo:${pageKey}`)?.value);
  }

  function isDirty(pageKey: string): boolean {
    const s = getStored(pageKey);
    const c = forms[pageKey] ?? EMPTY_FORM;
    return (c.title ?? "") !== (s.title ?? "") || (c.description ?? "") !== (s.description ?? "") ||
      (c.keywords ?? "") !== (s.keywords ?? "") || (c.ogImage ?? "") !== (s.ogImage ?? "") ||
      (c.canonicalPath ?? "") !== (s.canonicalPath ?? "");
  }

  function isCustomDirty(): boolean {
    const block = content?.find((b) => b.key === "seo:custom_tags");
    const saved = parseCustomTags(block?.value);
    return JSON.stringify(customTags) !== JSON.stringify(saved);
  }

  function handleSavePage() {
    if (!activePage) return;
    setSaving(true);
    const payload: StoredSEO = {
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      keywords: form.keywords.trim() || undefined,
      ogImage: form.ogImage.trim() || undefined,
      canonicalPath: form.canonicalPath.trim() || undefined,
    };
    upsertContent.mutate(
      { data: { key: `seo:${activeKey}`, value: JSON.stringify(payload) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey() });
          toast({ title: `SEO saved for ${activePage.label} page.` });
        },
        onError: () => toast({ title: "Failed to save SEO settings.", variant: "destructive" }),
        onSettled: () => setSaving(false),
      }
    );
  }

  function handleSaveCustomTags() {
    setSavingCustom(true);
    const clean = customTags.filter((t) => t.key.trim() && t.content.trim());
    upsertContent.mutate(
      { data: { key: "seo:custom_tags", value: JSON.stringify(clean) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetContentQueryKey() });
          toast({ title: "Custom meta tags saved. They are now live on every page." });
        },
        onError: () => toast({ title: "Failed to save custom tags.", variant: "destructive" }),
        onSettled: () => setSavingCustom(false),
      }
    );
  }

  function addTag() {
    setCustomTags((prev) => [...prev, { id: nanoid(), attr: "name", key: "", content: "" }]);
  }

  function updateTag(id: string, field: keyof CustomMetaTag, value: string) {
    setCustomTags((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function removeTag(id: string) {
    setCustomTags((prev) => prev.filter((t) => t.id !== id));
  }

  const pagesDirty = PAGES.some((p) => isDirty(p.key));
  const customDirty = isCustomDirty();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> SEO Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage meta tags, Open Graph data, and custom tags for every public page.
            </p>
          </div>

          {activeKey === "custom_tags" ? (
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleSaveCustomTags}
              disabled={!customDirty || savingCustom || isLoading}
            >
              {savingCustom ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save Tags
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setForms((prev) => ({ ...prev, [activeKey]: EMPTY_FORM }))}
                disabled={saving || isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Reset
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={handleSavePage}
                disabled={!isDirty(activeKey as string) || saving || isLoading}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Page
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-44 shrink-0 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pb-1">Pages</p>
            {PAGES.map((page) => {
              const stored = getStored(page.key);
              const hasCustom = !!(stored.title || stored.description || stored.keywords || stored.ogImage || stored.canonicalPath);
              const pageDirty = isDirty(page.key);
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => setActiveKey(page.key)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeKey === page.key ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 opacity-60" />
                    {page.label}
                  </span>
                  {pageDirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />}
                  {!pageDirty && hasCustom && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Custom SEO set" />}
                </button>
              );
            })}

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pb-1">Global</p>
              <button
                type="button"
                onClick={() => setActiveKey("custom_tags")}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeKey === "custom_tags" ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 opacity-60" />
                  Custom Tags
                </span>
                {customDirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />}
                {!customDirty && customTags.length > 0 && (
                  <span className="text-[10px] bg-primary/15 text-primary px-1.5 rounded-full font-semibold">{customTags.length}</span>
                )}
              </button>
            </div>
          </nav>

          {/* Form Panel */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : activeKey === "custom_tags" ? (
              <CustomTagsPanel
                tags={customTags}
                onAdd={addTag}
                onUpdate={updateTag}
                onRemove={removeTag}
              />
            ) : activePage ? (
              <PageSEOForm
                page={activePage}
                form={form}
                onUpdate={updateField}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ─── Page SEO Form ─────────────────────────────────────────────────────────── */

function PageSEOForm({
  page,
  form,
  onUpdate,
}: {
  page: (typeof PAGES)[number];
  form: FormState;
  onUpdate: (field: keyof FormState, value: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Globe className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">{page.label}</span>
        <span className="text-xs text-muted-foreground ml-1">{page.path}</span>
      </div>

      <Field label="Page Title" hint="Shown in browser tab and Google results. Recommended: 50–60 characters." counter={charCount(form.title, 55, 70)}>
        <input type="text" value={form.title} onChange={(e) => onUpdate("title", e.target.value)} placeholder={page.defaults.title} className="input-field" />
      </Field>

      <Field label="Meta Description" hint="Shown under the title in search results. Recommended: 140–160 characters." counter={charCount(form.description, 155, 175)}>
        <textarea rows={3} value={form.description} onChange={(e) => onUpdate("description", e.target.value)} placeholder={page.defaults.description} className="input-field resize-none" />
      </Field>

      <Field label="Keywords" hint="Comma-separated keywords. Helps categorise the page for search engines." counter={null}>
        <input type="text" value={form.keywords} onChange={(e) => onUpdate("keywords", e.target.value)} placeholder={page.defaults.keywords} className="input-field" />
      </Field>

      <div className="border-t border-border pt-5 space-y-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Graph / Social Sharing</p>
        <Field label="OG Image URL" hint="Image for social previews. Absolute URL (https://…). Recommended: 1200×630 px." counter={null}>
          <input type="url" value={form.ogImage} onChange={(e) => onUpdate("ogImage", e.target.value)} placeholder="https://yourdomain.com/og-image.jpg" className="input-field" />
          {form.ogImage && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border h-28 w-full bg-muted">
              <img src={form.ogImage} alt="OG preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </Field>
      </div>

      <div className="border-t border-border pt-5 space-y-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advanced</p>
        <Field label="Canonical URL Path" hint={`Override the canonical link tag. Usually left blank (defaults to ${page.path}).`} counter={null}>
          <input type="text" value={form.canonicalPath} onChange={(e) => onUpdate("canonicalPath", e.target.value)} placeholder={page.path} className="input-field" />
        </Field>
      </div>

      <div className="flex gap-2 bg-muted/60 rounded-lg p-3">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Fields left blank fall back to the built-in defaults shown as placeholders. Title is used for <code className="bg-background px-1 py-0.5 rounded text-[11px]">og:title</code> and <code className="bg-background px-1 py-0.5 rounded text-[11px]">twitter:title</code>. Description is used for <code className="bg-background px-1 py-0.5 rounded text-[11px]">og:description</code> and <code className="bg-background px-1 py-0.5 rounded text-[11px]">twitter:description</code>.
        </p>
      </div>
    </>
  );
}

/* ─── Custom Tags Panel ─────────────────────────────────────────────────────── */

function CustomTagsPanel({
  tags,
  onAdd,
  onUpdate,
  onRemove,
}: {
  tags: CustomMetaTag[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof CustomMetaTag, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <Tag className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">Custom Meta Tags</span>
        <span className="text-xs text-muted-foreground ml-1">All pages</span>
      </div>

      <div className="flex gap-2 bg-muted/60 rounded-lg p-3">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tags added here are injected via JavaScript into <code className="bg-background px-1 py-0.5 rounded text-[11px]">&lt;head&gt;</code> on <strong>every page</strong>. They work for analytics, social, and most site-wide meta tags.
        </p>
      </div>

      <div className="flex gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <span className="text-yellow-500 mt-0.5 shrink-0 text-sm">⚠️</span>
        <p className="text-xs text-yellow-800 leading-relaxed">
          <strong>Verification tags (Google, Bing, etc.) will not work here.</strong> Google's site verification crawler reads raw HTML and does not run JavaScript, so it cannot see tags injected by React. Verification tags must be added directly to <code className="bg-yellow-100 px-1 py-0.5 rounded text-[11px]">index.html</code> — ask your developer to do this, or they can be set through the Replit agent.
        </p>
      </div>

      {tags.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl">
          <Code className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No custom tags yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add a tag below to inject it into every page.</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-[120px_1fr_1fr_32px] gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">Attribute</span>
            <span className="text-xs font-medium text-muted-foreground">Tag name / key</span>
            <span className="text-xs font-medium text-muted-foreground">Content value</span>
            <span />
          </div>

          {tags.map((tag) => (
            <div key={tag.id} className="grid grid-cols-[120px_1fr_1fr_32px] gap-2 items-center">
              <select
                value={tag.attr}
                onChange={(e) => onUpdate(tag.id, "attr", e.target.value)}
                className="input-field text-xs h-9"
              >
                {ATTR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={tag.key}
                onChange={(e) => onUpdate(tag.id, "key", e.target.value)}
                placeholder="google-site-verification"
                className="input-field h-9 text-sm font-mono"
              />

              <input
                type="text"
                value={tag.content}
                onChange={(e) => onUpdate(tag.id, "content", e.target.value)}
                placeholder="pzZZHxtBj8Mhk8Cs…"
                className="input-field h-9 text-sm font-mono"
              />

              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="flex items-center justify-center w-8 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove tag"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={onAdd} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Add Meta Tag
      </Button>

      {tags.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
          <div className="bg-muted rounded-lg p-3 space-y-1 overflow-x-auto">
            {tags.map((tag) => (
              <p key={tag.id} className="text-xs font-mono text-foreground whitespace-nowrap">
                {`<meta ${tag.attr}="${tag.key || '…'}" content="${tag.content || '…'}" />`}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Field ──────────────────────────────────────────────────────────── */

function Field({ label, hint, counter, children }: { label: string; hint: string; counter: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {counter}
      </div>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
