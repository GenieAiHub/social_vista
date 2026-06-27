import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requirePermission } from "../lib/auth.js";
import type { BlogPostRow } from "@workspace/db";

const router = Router();

function calcReadTime(content: string): string {
  const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function serialize(p: BlogPostRow) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    tags: p.tags,
    authorName: p.authorName,
    coverImageUrl: p.coverImageUrl ?? null,
    published: p.published,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    readTime: calcReadTime(p.content),
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

router.get("/blog", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true))
      .orderBy(desc(blogPostsTable.publishedAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Failed to list blog posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, req.params.slug))
      .limit(1);
    if (!post || !post.published) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(serialize(post));
  } catch (err) {
    req.log.error({ err }, "Failed to get blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/blog", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Failed to list admin blog posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/blog", requireAuth, requirePermission("canManageBlog"), async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, authorName, coverImageUrl, published, slug: customSlug } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const slug = (customSlug?.trim() || generateSlug(title)).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    const now = new Date();
    const [post] = await db
      .insert(blogPostsTable)
      .values({
        slug,
        title: title.trim(),
        excerpt: typeof excerpt === "string" ? excerpt.trim() : "",
        content: typeof content === "string" ? content : "",
        category: typeof category === "string" && category.trim() ? category.trim() : "General",
        tags: Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === "string" && t.trim()) : [],
        authorName: typeof authorName === "string" && authorName.trim() ? authorName.trim() : "Social Vista Team",
        coverImageUrl: typeof coverImageUrl === "string" && coverImageUrl.trim() ? coverImageUrl.trim() : null,
        published: Boolean(published),
        publishedAt: published ? now : null,
        updatedAt: now,
      })
      .returning();
    res.status(201).json(serialize(post));
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "A post with that slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/blog/:id", requireAuth, requirePermission("canManageBlog"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const { title, excerpt, content, category, tags, authorName, coverImageUrl, published, slug } = req.body;
    const updates: Partial<typeof blogPostsTable.$inferInsert> = { updatedAt: new Date() };
    if (slug !== undefined) updates.slug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (title !== undefined) updates.title = String(title).trim();
    if (excerpt !== undefined) updates.excerpt = String(excerpt).trim();
    if (content !== undefined) updates.content = String(content);
    if (category !== undefined) updates.category = String(category).trim() || "General";
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === "string" && (t as string).trim()) : [];
    if (authorName !== undefined) updates.authorName = String(authorName).trim() || "Social Vista Team";
    if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl ? String(coverImageUrl).trim() : null;
    if (published !== undefined) {
      updates.published = Boolean(published);
      if (published) {
        const [existing] = await db
          .select({ publishedAt: blogPostsTable.publishedAt })
          .from(blogPostsTable)
          .where(eq(blogPostsTable.id, id))
          .limit(1);
        if (!existing?.publishedAt) updates.publishedAt = new Date();
      }
    }
    const [post] = await db
      .update(blogPostsTable)
      .set(updates)
      .where(eq(blogPostsTable.id, id))
      .returning();
    if (!post) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serialize(post));
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "A post with that slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to update blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/blog/:id", requireAuth, requirePermission("canManageBlog"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete blog post");
    res.status(500).json({ error: "Internal server error" });
  }
});

export async function seedBlogPosts(): Promise<void> {
  const existing = await db.select({ id: blogPostsTable.id }).from(blogPostsTable).limit(1);
  if (existing.length > 0) return;

  const posts = [
    {
      slug: "social-media-growth-strategy-2026",
      title: "How to Build a Social Media Growth Strategy That Actually Converts",
      excerpt: "Followers are vanity, revenue is sanity. Here is the exact framework we use to turn social channels into predictable pipelines for our clients.",
      content: `<p>Most brands treat social media like a megaphone — they broadcast, hope, and measure success in likes. The brands that win treat it like a system: a repeatable engine that turns attention into leads and leads into revenue. The difference is strategy.</p><p>Start with positioning. Before you post a single reel, you need a crystal-clear answer to three questions: who is your ideal customer, what transformation do you offer them, and why should they choose you over the dozen alternatives in their feed? Every piece of content should ladder back to that positioning.</p><p>Next, build a content engine around three buckets — authority, relatability, and conversion. Authority content proves you know your craft. Relatability content makes you human and shareable. Conversion content moves people to act. A healthy mix keeps you top-of-mind without feeling like a constant sales pitch.</p><p>Finally, close the loop with measurement. Tie every campaign to a KPI that matters — qualified leads, booked calls, or revenue — not just reach. When you know which content drives business outcomes, you double down on what works and cut what doesn't. That is how social media becomes a growth channel instead of a cost center.</p>`,
      category: "Social Media",
      tags: ["strategy", "social media", "growth"],
      authorName: "Social Vista Team",
      published: true,
      publishedAt: new Date("2026-05-28"),
    },
    {
      slug: "whatsapp-automation-for-business",
      title: "WhatsApp Automation: The Sales Channel Most Brands Ignore",
      excerpt: "With open rates above 90%, WhatsApp is the most underused conversion channel in your stack. Here is how to automate it without losing the human touch.",
      content: `<p>Email open rates hover around 20%. WhatsApp messages get opened more than 90% of the time, usually within minutes. Yet most businesses still treat WhatsApp as a personal app rather than the highest-intent sales channel they own.</p><p>A well-built WhatsApp chatbot can qualify leads, answer FAQs, book appointments, and recover abandoned carts — all automatically, 24/7. The key is designing conversational flows that feel helpful, not robotic. Lead with value, keep messages short, and always offer a fast path to a human when the conversation gets complex.</p><p>Broadcast campaigns are the other half of the equation. Segmented, permission-based broadcasts let you announce launches, share offers, and re-engage dormant customers with a channel they actually check. Done right, response rates dwarf anything you'll see from email.</p><p>The brands that adopt WhatsApp automation now are building a direct, high-trust line to their customers before it gets crowded. The technology is mature, compliant, and ready — the only question is whether you'll use it before your competitors do.</p>`,
      category: "Automation",
      tags: ["whatsapp", "automation", "sales"],
      authorName: "Social Vista Team",
      published: true,
      publishedAt: new Date("2026-05-14"),
    },
    {
      slug: "ai-in-digital-marketing",
      title: "Where AI Actually Helps in Digital Marketing (and Where It Doesn't)",
      excerpt: "AI is not magic, but used well it compounds your team's output. Here is our honest take on where automation pays off and where the human still wins.",
      content: `<p>AI has gone from novelty to necessity in digital marketing, but the hype has outpaced the reality. The teams getting real returns are not the ones chasing every shiny tool — they are the ones who know exactly where AI adds leverage and where human judgment is still irreplaceable.</p><p>AI shines at scale and speed: drafting first versions of copy, generating content variations for testing, summarizing data, personalizing messages, and powering chatbots that handle routine questions. These are repetitive, pattern-heavy tasks where machines free your team to focus on higher-value work.</p><p>Where AI still falls short is strategy, taste, and trust. It can write a hundred captions, but it cannot decide what your brand should stand for. It can suggest a campaign angle, but it cannot read the room of a sensitive cultural moment. The best results come from pairing AI's output with human direction and editing.</p><p>Our philosophy is simple: let AI handle the volume, let humans own the vision. When you combine automation with genuine creative strategy, you get the best of both — the efficiency of software and the resonance of work made by people who understand people.</p>`,
      category: "AI & Technology",
      tags: ["ai", "marketing", "automation"],
      authorName: "Social Vista Team",
      published: true,
      publishedAt: new Date("2026-04-30"),
    },
    {
      slug: "why-brands-need-influencer-marketing",
      title: "Why Influencer Marketing Outperforms Traditional Ads in 2026",
      excerpt: "Trust has become the scarcest currency online. Influencer partnerships borrow it — here is how to run campaigns that drive real ROI.",
      content: `<p>Consumers have learned to tune out ads. They scroll past banners, skip pre-rolls, and install blockers. What they still listen to is people they trust — which is exactly why influencer marketing keeps outperforming traditional paid media on engagement and conversion.</p><p>The secret is not chasing the biggest names. Micro and mid-tier creators often deliver better ROI because their audiences are tighter, more engaged, and more likely to act on a recommendation. Relevance beats reach almost every time.</p><p>Successful campaigns start with fit. The creator's audience, tone, and values have to align with your brand, or the partnership reads as a transaction rather than a recommendation. From there, give creators creative freedom — they know what resonates with their audience better than any brand brief.</p><p>Measure beyond vanity metrics. Use unique codes, affiliate links, and landing pages to connect each partnership to real outcomes. When you treat influencer marketing as a performance channel rather than a branding nicety, it becomes one of the most cost-effective ways to grow.</p>`,
      category: "Marketing",
      tags: ["influencer", "marketing", "roi"],
      authorName: "Social Vista Team",
      published: true,
      publishedAt: new Date("2026-04-12"),
    },
  ];

  for (const p of posts) {
    await db.insert(blogPostsTable).values({ ...p, updatedAt: p.publishedAt ?? new Date() }).onConflictDoNothing();
  }
}

export default router;
