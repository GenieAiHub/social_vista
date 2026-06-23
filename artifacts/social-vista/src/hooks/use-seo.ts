import { useEffect, useMemo } from "react";
import { useGetContent } from "@workspace/api-client-react";

interface SEOOptions {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
  canonicalPath?: string;
  jsonLd?: object | object[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const JSONLD_ID = "seo-jsonld";

export function useSEO({
  title,
  description,
  keywords,
  image,
  type = "website",
  canonicalPath,
  jsonLd,
}: SEOOptions) {
  useEffect(() => {
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL;
    const url = origin + (canonicalPath ?? window.location.pathname);
    const resolvedImage = image
      ? image.startsWith("http")
        ? image
        : origin + image
      : origin + base + "opengraph.jpg";

    document.title = title;
    upsertMeta("name", "description", description);
    if (keywords) upsertMeta("name", "keywords", keywords);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", resolvedImage);

    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", resolvedImage);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = JSONLD_ID;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      const existing = document.getElementById(JSONLD_ID);
      if (existing) existing.remove();
    };
  }, [title, description, keywords, image, type, canonicalPath, JSON.stringify(jsonLd)]);
}

export interface StoredSEO {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
}

export function parseSEOBlock(value: string | null | undefined): StoredSEO {
  if (!value) return {};
  try {
    return JSON.parse(value) as StoredSEO;
  } catch {
    return {};
  }
}

export function usePageSEO(pageKey: string, defaults: SEOOptions) {
  const { data: content } = useGetContent();

  const stored = useMemo<StoredSEO>(() => {
    const block = content?.find((b) => b.key === `seo:${pageKey}`);
    return parseSEOBlock(block?.value);
  }, [content, pageKey]);

  useSEO({
    ...defaults,
    title: stored.title || defaults.title,
    description: stored.description || defaults.description,
    keywords: stored.keywords || defaults.keywords,
    image: stored.ogImage || defaults.image,
    canonicalPath: stored.canonicalPath || defaults.canonicalPath,
  });
}
