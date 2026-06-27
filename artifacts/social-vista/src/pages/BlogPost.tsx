import { Link, useRoute } from "wouter";
import { ArrowRight, ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useGetBlogPost, useListBlogPosts } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/use-seo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";

  const { data: post, isLoading, isError } = useGetBlogPost(slug, {
    query: { enabled: !!slug, retry: false },
  });
  const { data: allPosts } = useListBlogPosts();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = origin + import.meta.env.BASE_URL.replace(/\/$/, "");

  useSEO({
    title: post
      ? `${post.title} | Social Vista Blog`
      : "Article Not Found | Social Vista Blog",
    description: post?.excerpt ?? "The article you're looking for could not be found.",
    type: "article",
    keywords: post ? [post.category, ...(post.tags ?? [])].join(", ") : undefined,
    jsonLd: post
      ? [
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt ?? post.createdAt,
            author: { "@type": "Organization", name: post.authorName },
            publisher: { "@type": "Organization", name: "Social Vista" },
            url: `${siteUrl}/blog/${post.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
            ],
          },
        ]
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-40 pb-32 max-w-3xl mx-auto px-4 space-y-6 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded-full" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="space-y-3 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded w-full" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <section className="pt-40 pb-32 max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold font-serif mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or may have been moved.
          </p>
          <Link href="/blog">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Blog
            </Button>
          </Link>
        </section>
        <Footer />
      </div>
    );
  }

  const related = (allPosts ?? []).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <article className="relative overflow-hidden pt-28 md:pt-36 pb-16">
        <div className="blob bg-secondary w-[420px] h-[420px] -top-24 -left-24" />
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" data-testid="link-back-blog">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </span>
          </Link>

          {post.coverImageUrl && (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full rounded-2xl object-cover max-h-72 mb-8"
            />
          )}

          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-[11px] text-accent font-semibold mb-5">
            {post.category}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-serif leading-[1.1] mb-6">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground border-b border-border pb-8 mb-10">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.authorName}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
          </div>

          <div
            className="prose prose-base max-w-none text-foreground [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:font-serif [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:font-serif [&_h2]:mt-7 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-[15px] [&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-6 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-4 [&_hr]:border-border [&_hr]:my-8 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-border">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary border border-primary/15 text-primary rounded-full px-2.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="card-soft bg-card rounded-2xl p-8 mt-12 text-center">
            <h3 className="text-xl font-bold font-serif mb-3">Ready to put this into action?</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Book a free consultation and we'll build a growth plan tailored to your brand.
            </p>
            <Link href="/contact" data-testid="link-blogpost-cta">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
                Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-16 bg-muted/40 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold font-serif mb-8">Keep reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} data-testid={`link-related-${p.slug}`}>
                  <div className="card-soft bg-card rounded-2xl p-6 cursor-pointer group h-full">
                    <div className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-3">{p.category}</div>
                    <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
                      {p.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{p.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
