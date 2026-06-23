import { useEffect } from "react";
import { useGetContent } from "@workspace/api-client-react";

export interface CustomMetaTag {
  id: string;
  attr: "name" | "property" | "http-equiv";
  key: string;
  content: string;
}

const CUSTOM_TAGS_KEY = "seo:custom_tags";
const DATA_ATTR = "data-custom-seo";

export function parseCustomTags(value: string | null | undefined): CustomMetaTag[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is CustomMetaTag =>
        t &&
        typeof t.id === "string" &&
        typeof t.key === "string" &&
        typeof t.content === "string" &&
        ["name", "property", "http-equiv"].includes(t.attr)
    );
  } catch {
    return [];
  }
}

export default function CustomMetaInjector() {
  const { data: content } = useGetContent();

  useEffect(() => {
    const block = content?.find((b) => b.key === CUSTOM_TAGS_KEY);
    const tags = parseCustomTags(block?.value);

    // Remove previously injected tags
    document.head
      .querySelectorAll(`meta[${DATA_ATTR}]`)
      .forEach((el) => el.remove());

    // Inject current tags
    tags.forEach((tag) => {
      if (!tag.key.trim() || !tag.content.trim()) return;
      const el = document.createElement("meta");
      el.setAttribute(tag.attr, tag.key.trim());
      el.setAttribute("content", tag.content.trim());
      el.setAttribute(DATA_ATTR, tag.id);
      document.head.appendChild(el);
    });

    return () => {
      document.head
        .querySelectorAll(`meta[${DATA_ATTR}]`)
        .forEach((el) => el.remove());
    };
  }, [content]);

  return null;
}
