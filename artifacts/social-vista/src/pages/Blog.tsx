import { Link } from "wouter";
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useListBlogPosts } from "@workspace/api-client-react";
import { usePageSEO } from "@/hooks/use-seo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function PostSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
      <div className="h-4 w-16 bg-muted rounded-full mb-4" />
      <div className="h-5 w-3/4 bg-muted rounded mb-2" />
      <div className="h-4 w-full bg-muted rounded mb-1" />
      <div className="h-4 w-2/3 bg-muted rounded" />
    </div>
  );
}

export default function Blog() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = origin + import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: posts, isLoading } = useListBlogPosts();

  usePageSEO("blog", {
    title: "Blog — Insights on Social Media, Automation & Digital Growth | Social Vista",
    description:
      "Practical insights on social media strategy, WhatsApp automation, AI in marketing, influencer marketing, and digital growth from the Social Vista team.",
    keywords:
      "digital marketing blog, social media tips, whatsapp automation, ai marketing, influencer marketing, growth strategy",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Social Vista Blog",
      url: `${siteUrl}/blog`,
      blogPost: (posts ?? []).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        datePublished: p.publishedAt ?? p.createdAt,
        author: { "@type": "Organization", name: p.authorName },
        url: `${siteUrl}/blog/${p.slug}`,
      })),
    },
  });

  const [featured, ...rest] = posts ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16">
        <div className="blob bg-secondary w-[480px] h-[480px] -top-24 -left-24" />
        <div className="blob bg-accent/15 w-[420px] h-[420px] top-10 -right-24" />
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> The Social Vista Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif leading-[1.05] mb-6">
            Insights to Help You <span className="text-gradient">Grow</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Practical strategies on social media, automation, AI, and digital growth — straight from the team in the
            trenches.
          </p>
        </div>
      </section>

      {isLoading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
          <div className="bg-card rounded-3xl p-10 border border-border animate-pulse h-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        </section>
      ) : (posts?.length ?? 0) === 0 ? (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center py-24">
          <p className="text-muted-foreground text-lg">No articles yet — check back soon.</p>
        </section>
      ) : (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <Link href={`/blog/${featured.slug}`} data-testid={`link-blog-${featured.slug}`}>
              <div className="card-soft bg-card rounded-3xl p-8 md:p-12 cursor-pointer group">
                <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-[11px] text-accent font-semibold mb-5">
                  {featured.category}
                </div>
                <h2 className="text-2xl md:text-4xl font-bold font-serif mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(featured.publishedAt ?? featured.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featured.readTime}</span>
                  <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                    Read article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </section>

          {rest.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} data-testid={`link-blog-${post.slug}`}>
                    <article className="card-soft bg-card rounded-2xl p-6 cursor-pointer group h-full flex flex-col">
                      <div className="inline-flex items-center gap-2 bg-secondary border border-primary/15 rounded-full px-3 py-1 text-[11px] text-primary font-semibold mb-4 self-start">
                        {post.category}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt ?? post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="py-20 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-5">
            Want results like the ones we write about?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Book a free consultation and let's build your growth plan together.
          </p>
          <Link href="/contact" data-testid="link-blog-cta">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
              Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
