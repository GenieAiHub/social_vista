import { useRoute, Link } from "wouter";
import { ArrowRight, ArrowLeft, Check, Sparkles, Share2 } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { iconMap, slugify, serviceContent } from "@/lib/services-content";
import { useSEO } from "@/hooks/use-seo";

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:slug");
  const slug = params?.slug ?? "";
  const { data: services, isLoading } = useListServices();

  const service = services?.find((s) => slugify(s.title) === slug);
  const content = serviceContent[slug];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  useSEO({
    title: service ? `${service.title} — Social Vista` : "Service — Social Vista",
    description:
      content?.intro ??
      "Discover how Social Vista can help your brand grow with expert digital services.",
    keywords: service
      ? `${service.title.toLowerCase()}, ${service.category.toLowerCase()}, social vista, digital agency`
      : undefined,
    type: "article",
    image: content?.image,
    jsonLd:
      service && content
        ? [
            {
              "@context": "https://schema.org",
              "@type": "Service",
              name: service.title,
              serviceType: service.category,
              description: content.intro,
              provider: {
                "@type": "Organization",
                name: "Social Vista",
                url: siteUrl,
              },
              areaServed: "Worldwide",
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
                { "@type": "ListItem", position: 3, name: service.title },
              ],
            },
          ]
        : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-40 max-w-5xl mx-auto px-4 space-y-6">
          <div className="h-10 w-2/3 bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!service || !content) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-40">
          <h1 className="text-3xl font-bold font-serif mb-3">Service not found</h1>
          <p className="text-muted-foreground mb-8">The service you are looking for does not exist.</p>
          <Link href="/services">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Services
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = iconMap[service.icon] ?? Share2;
  const related = (services ?? [])
    .filter((s) => s.active && s.id !== service.id && serviceContent[slugify(s.title)])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="blob bg-secondary w-[480px] h-[400px] -top-20 -left-24" />
        <div className="blob bg-accent/12 w-[360px] h-[360px] top-10 -right-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/services"><span className="hover:text-primary cursor-pointer">Services</span></Link>
              <span>/</span>
              <span className="text-foreground">{service.title}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-5">
              <Icon className="w-3.5 h-3.5" /> {service.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif leading-tight mb-4">
              {service.title}
            </h1>
            <p className="text-xl text-gradient font-semibold font-serif mb-5">{content.tagline}</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{content.intro}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" data-testid="button-service-detail-cta">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="border-border hover:border-primary/50 hover:text-primary font-semibold rounded-full px-8 bg-background">
                  All Services
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="blob bg-primary/15 w-72 h-72 top-6 left-10" />
            <div className="relative z-10 bg-card card-soft rounded-3xl p-6">
              <img src={content.image} alt={service.title} className="w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-3">
              Why Choose This <span className="text-gradient">Service</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">The outcomes that make a real difference for your business.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.benefits.map((b) => (
              <div key={b.title} className="bg-card card-soft rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 glow-primary">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="blob bg-accent/12 w-72 h-72 bottom-0 right-10" />
            <div className="relative z-10 bg-secondary/40 rounded-3xl p-8 border border-primary/10">
              <img src={content.image} alt={service.title} className="w-full rounded-2xl" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-5">
              What's Included
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              A complete, done-for-you package — we handle the details so you can focus on growth.
            </p>
            <ul className="space-y-4">
              {content.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </span>
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/contact" className="inline-block mt-8">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-7">
                Request a Quote <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related services */}
      {related.length > 0 && (
        <section className="py-16 bg-muted/40 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold font-serif mb-8 text-center">Explore Related Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((s) => {
                const RIcon = iconMap[s.icon] ?? Share2;
                return (
                  <Link key={s.id} href={`/services/${slugify(s.title)}`}>
                    <div className="card-soft bg-card rounded-2xl p-6 group cursor-pointer h-full">
                      <div className="w-11 h-11 rounded-xl bg-secondary border border-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                        <RIcon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{s.description}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                        Learn more <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="relative overflow-hidden max-w-6xl mx-auto rounded-3xl bg-gradient-brand px-6 py-14 text-center">
          <div className="blob bg-white/20 w-72 h-72 -top-16 -left-10" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-white">
              Ready to get started with {service.title}?
            </h2>
            <p className="text-white/85 mb-8 text-lg">
              Let's build a plan tailored to your goals. Book a free consultation today.
            </p>
            <Link href="/contact" data-testid="button-service-final-cta">
              <Button size="lg" className="bg-white hover:bg-white/90 text-primary font-semibold rounded-full px-10 py-6 text-base">
                Book a Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
