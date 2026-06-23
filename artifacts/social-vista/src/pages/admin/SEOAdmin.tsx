import { useState, useEffect } from "react";
import { Search, Save, RefreshCw, Globe, Info } from "lucide-react";
import { useGetContent, useUpsertContent, getGetContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseSEOBlock, type StoredSEO } from "@/hooks/use-seo";

const PAGES = [
  {
    key: "home",
    label: "Home",
    path: "/",
    defaults: {
      title: "Social Vista — Digital Growth, Social Media & AI Marketing Agency",
      description:
        "Social Vista is a full-service digital agency. We help brands grow louder and convert faster with social media management, WhatsApp automation, content & influencer marketing, email marketing, SaaS and Web3 development.",
      keywords:
        "digital marketing agency, social media management, whatsapp chatbot, whatsapp marketing, content creation, influencer marketing, email marketing, saas development, web3 development, ai automation",
    },
  },
  {
    key: "about",
    label: "About",
    path: "/about",
    defaults: {
      title: "About Social Vista — Your Full-Service Digital Growth Partner",
      description:
        "Learn about Social Vista, a full-service digital agency combining creative strategy with AI-powered automation. Discover our mission, values, and the team driving brand growth worldwide.",
      keywords:
        "about social vista, digital marketing agency, our mission, agency values, growth partner, social media agency team",
    },
  },
  {
    key: "services",
    label: "Services",
    path: "/services",
    defaults: {
      title: "Our Services — Social Media, Automation & Development | Social Vista",
      description:
        "Explore Social Vista's full range of digital services: social media management, WhatsApp chatbots & campaigns, content & influencer marketing, email marketing, SaaS and Web3 development.",
      keywords:
        "digital agency services, social media management, whatsapp chatbot, whatsapp campaigns, content creation, influencer marketing, email marketing, saas development, web3 development",
    },
  },
  {
    key: "blog",
    label: "Blog",
    path: "/blog",
    defaults: {
      title: "Blog — Insights on Social Media, Automation & Digital Growth | Social Vista",
      description:
        "Practical insights on social media strategy, WhatsApp automation, AI in marketing, influencer marketing, and digital growth from the Social Vista team.",
      keywords:
        "digital marketing blog, social media tips, whatsapp automation, ai marketing, influencer marketing, growth strategy",
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    path: "/pricing",
    defaults: {
      title: "Pricing — Custom Plans for Every Stage | Social Vista",
      description:
        "Flexible, custom pricing scoped to your goals and budget. Explore Social Vista's Starter, Growth, and Enterprise plans for social media, automation, and development.",
      keywords:
        "social media agency pricing, digital marketing packages, whatsapp automation pricing, agency plans, custom marketing quote",
    },
  },
  {
    key: "faq",
    label: "FAQ",
    path: "/faq",
    defaults: {
      title: "FAQ — Frequently Asked Questions | Social Vista",
      description:
        "Answers to common questions about Social Vista's services, pricing, onboarding, reporting, and how we help brands grow with social media, automation, and development.",
      keywords:
        "social vista faq, digital agency questions, pricing, onboarding, social media agency faq",
    },
  },
  {
    key: "contact",
    label: "Contact",
    path: "/contact",
    defaults: {
      title: "Contact Us — Get a Free Consultation | Social Vista",
      description:
        "Ready to grow? Contact Social Vista for a free consultation. Tell us about your project and our team will reply within 24 hours with a tailored proposal.",
      keywords: "contact social vista, free consultation, hire digital agency, marketing agency quote",
    },
  },
];

type PageKey = (typeof PAGES)[number]["key"];

interface FormState {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalPath: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  keywords: "",
  ogImage: "",
  canonicalPath: "",
};

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

  const activePage = PAGES.find((p) => p.key === activeKey)!;
  const form: FormState = forms[activeKey] ?? EMPTY_FORM;

  function updateField(field: keyof FormState, value: string) {
    setForms((prev) => ({
      ...prev,
      [activeKey]: { ...(prev[activeKey] ?? EMPTY_FORM), [field]: value },
    }));
  }

  function getBlock(pageKey: string): StoredSEO {
    const block = content?.find((b) => b.key === `seo:${pageKey}`);
    return parseSEOBlock(block?.value);
  }

  function isDirty(pageKey: string): boolean {
    const stored = getBlock(pageKey);
    const current = forms[pageKey] ?? EMPTY_FORM;
    return (
      (current.title ?? "") !== (stored.title ?? "") ||
      (current.description ?? "") !== (stored.description ?? "") ||
      (current.keywords ?? "") !== (stored.keywords ?? "") ||
      (current.ogImage ?? "") !== (stored.ogImage ?? "") ||
      (current.canonicalPath ?? "") !== (stored.canonicalPath ?? "")
    );
  }

  function handleSave() {
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
        onError: () =>
          toast({ title: "Failed to save SEO settings.", variant: "destructive" }),
        onSettled: () => setSaving(false),
      }
    );
  }

  function handleReset() {
    setForms((prev) => ({ ...prev, [activeKey]: EMPTY_FORM }));
  }

  const dirty = isDirty(activeKey);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> SEO Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set page-level meta tags, descriptions, keywords, and Open Graph data for each public page.
              Leave a field blank to keep the built-in default.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || isLoading}
              title="Clear all fields for this page (restores built-in defaults)"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleSave}
              disabled={!dirty || saving || isLoading}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save Page
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Page Tabs */}
          <nav className="w-40 shrink-0 space-y-1">
            {PAGES.map((page) => {
              const hasCustom = (() => {
                const b = getBlock(page.key);
                return !!(b.title || b.description || b.keywords || b.ogImage || b.canonicalPath);
              })();
              const pageDirty = isDirty(page.key);
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => setActiveKey(page.key as PageKey)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeKey === page.key
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 opacity-60" />
                    {page.label}
                  </span>
                  {pageDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />
                  )}
                  {!pageDirty && hasCustom && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Custom SEO set" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Form */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{activePage.label}</span>
                  <span className="text-xs text-muted-foreground ml-1">{activePage.path}</span>
                </div>

                {/* Title */}
                <Field
                  label="Page Title"
                  hint="Shown in browser tab and Google search results. Recommended: 50–60 characters."
                  counter={charCount(form.title, 55, 70)}
                  placeholder={activePage.defaults.title}
                >
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder={activePage.defaults.title}
                    className="input-field"
                  />
                </Field>

                {/* Meta Description */}
                <Field
                  label="Meta Description"
                  hint="Shown under the title in search results. Recommended: 140–160 characters."
                  counter={charCount(form.description, 155, 175)}
                  placeholder={activePage.defaults.description}
                >
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder={activePage.defaults.description}
                    className="input-field resize-none"
                  />
                </Field>

                {/* Keywords */}
                <Field
                  label="Keywords"
                  hint="Comma-separated keywords. Not a major ranking factor, but helps categorise content."
                  counter={null}
                  placeholder={activePage.defaults.keywords ?? ""}
                >
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    placeholder={activePage.defaults.keywords ?? ""}
                    className="input-field"
                  />
                </Field>

                <div className="border-t border-border pt-5 space-y-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Graph / Social Sharing</p>

                  {/* OG Image */}
                  <Field
                    label="OG Image URL"
                    hint="Image shown when this page is shared on social media. Use an absolute URL (https://…). Recommended: 1200×630 px."
                    counter={null}
                    placeholder="https://yourdomain.com/og-image.jpg"
                  >
                    <input
                      type="url"
                      value={form.ogImage}
                      onChange={(e) => updateField("ogImage", e.target.value)}
                      placeholder="https://yourdomain.com/og-image.jpg"
                      className="input-field"
                    />
                    {form.ogImage && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border h-28 w-full bg-muted flex items-center justify-center">
                        <img
                          src={form.ogImage}
                          alt="OG preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </Field>
                </div>

                <div className="border-t border-border pt-5 space-y-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advanced</p>

                  {/* Canonical */}
                  <Field
                    label="Canonical URL Path"
                    hint={`Override the canonical link tag. Usually left blank (defaults to the page path: ${activePage.path}).`}
                    counter={null}
                    placeholder={activePage.path}
                  >
                    <input
                      type="text"
                      value={form.canonicalPath}
                      onChange={(e) => updateField("canonicalPath", e.target.value)}
                      placeholder={activePage.path}
                      className="input-field"
                    />
                  </Field>
                </div>

                {/* Info notice */}
                <div className="flex gap-2 bg-muted/60 rounded-lg p-3">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Fields left blank fall back to the built-in defaults shown as placeholders. The
                    page title is used for both the browser tab and{" "}
                    <code className="bg-background px-1 py-0.5 rounded text-[11px]">og:title</code> /
                    <code className="bg-background px-1 py-0.5 rounded text-[11px]">twitter:title</code>.
                    The description is used for{" "}
                    <code className="bg-background px-1 py-0.5 rounded text-[11px]">meta description</code>,{" "}
                    <code className="bg-background px-1 py-0.5 rounded text-[11px]">og:description</code>, and{" "}
                    <code className="bg-background px-1 py-0.5 rounded text-[11px]">twitter:description</code>.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  hint,
  counter,
  placeholder: _placeholder,
  children,
}: {
  label: string;
  hint: string;
  counter: React.ReactNode;
  placeholder: string;
  children: React.ReactNode;
}) {
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
