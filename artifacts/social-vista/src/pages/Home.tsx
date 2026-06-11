import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Globe, TrendingUp, Users, Bot, CheckCircle, Star, Sparkles, ChevronDown } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiTiktok } from "react-icons/si";
import { Linkedin } from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { iconMap, slugify } from "@/lib/services-content";
import { Share2 } from "lucide-react";
import heroTeam from "@/assets/hero-team.png";
import { useSEO } from "@/hooks/use-seo";

const faqs = [
  {
    q: "What services does Social Vista offer?",
    a: "We are a full-service digital agency. Our work spans social media management, WhatsApp chatbots and broadcast campaigns, content creation and influencer marketing, email marketing, Zoom meeting automation, software consultancy, SaaS product development, and crypto/Web3 builds.",
  },
  {
    q: "How quickly can we get started?",
    a: "Most engagements kick off within a few days. After a free consultation we send a tailored proposal, and once it is approved we begin onboarding immediately — usually with first deliverables live inside the first one to two weeks.",
  },
  {
    q: "Do you work with startups and small businesses?",
    a: "Absolutely. We work with everyone from early-stage startups and solo founders to established brands. Every plan is scoped to your goals and budget, so you only pay for what moves the needle for your business.",
  },
  {
    q: "How do you measure success and report results?",
    a: "We tie every service to clear KPIs and share transparent monthly reports with real-time dashboards. You will always see how activity translates into reach, engagement, leads, and revenue.",
  },
  {
    q: "What makes Social Vista different?",
    a: "We combine creative strategy with cutting-edge AI automation under one roof. Instead of juggling multiple vendors, you get a single team that handles strategy, content, technology, and reporting end to end.",
  },
  {
    q: "How does pricing work?",
    a: "Pricing is custom and project-based. After understanding your goals we recommend the right mix of services and provide a clear, no-obligation quote. Book a free consultation to get yours.",
  },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [start, target, duration]);
  return count;
}

function StatCard({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 2000, visible);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold text-gradient font-serif">{count}{suffix}</div>
      <div className="text-muted-foreground text-sm mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const { data: services } = useListServices();
  const { data: testimonials } = useListTestimonials();
  const featured = services?.filter(s => s.active).slice(0, 6) ?? [];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  useSEO({
    title: "Social Vista — Digital Growth, Social Media & AI Marketing Agency",
    description:
      "Social Vista is a full-service digital agency. We help brands grow louder and convert faster with social media management, WhatsApp automation, content & influencer marketing, email marketing, SaaS and Web3 development.",
    keywords:
      "digital marketing agency, social media management, whatsapp chatbot, whatsapp marketing, content creation, influencer marketing, email marketing, saas development, web3 development, ai automation",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Social Vista",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
        description:
          "A full-service digital agency helping brands grow with social media, automation, content, and product development.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@socialvista.agency",
          contactType: "customer service",
          areaServed: "Worldwide",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Social Vista",
        url: siteUrl,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-20">
        <div className="blob bg-secondary w-[480px] h-[480px] -top-24 -left-24" />
        <div className="blob bg-accent/15 w-[420px] h-[420px] top-10 -right-24" />
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Your Full-Service Digital Growth Partner
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-serif leading-[1.05] mb-6">
              Grow Louder.{" "}
              <span className="text-gradient">Convert Faster.</span>{" "}
              Lead Boldly.
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-8">
              From social media mastery to SaaS development, Web3, and AI-powered automation — Social Vista helps your brand reach further and grow smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" data-testid="button-hero-cta">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
                  Start Your Project <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/services" data-testid="button-hero-services">
                <Button size="lg" variant="outline" className="border-border hover:border-primary/50 hover:text-primary font-semibold rounded-full px-8 bg-background">
                  Explore Services
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-5 mt-10 text-muted-foreground/60">
              <span className="text-xs font-medium text-muted-foreground">Across every platform</span>
              <SiInstagram className="w-5 h-5 hover:text-primary transition-colors cursor-default" />
              <SiFacebook className="w-5 h-5 hover:text-primary transition-colors cursor-default" />
              <SiX className="w-5 h-5 hover:text-foreground transition-colors cursor-default" />
              <Linkedin className="w-5 h-5 hover:text-primary transition-colors cursor-default" />
              <SiTiktok className="w-5 h-5 hover:text-foreground transition-colors cursor-default" />
            </div>
          </div>

          <div className="relative">
            <div className="blob bg-primary/15 w-72 h-72 top-8 left-8" />
            <div className="blob bg-accent/15 w-64 h-64 bottom-0 right-8" />
            <div className="relative z-10">
              <div className="card-soft bg-card rounded-3xl p-3 sm:p-4 shadow-xl">
                <img
                  src={heroTeam}
                  alt="Social Vista team analyzing social media analytics and growth dashboards"
                  className="w-full h-auto rounded-2xl"
                  loading="eager"
                  width={1024}
                  height={950}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={200} label="Brands Served" suffix="+" />
          <StatCard value={98} label="Client Satisfaction" suffix="%" />
          <StatCard value={5} label="Years Experience" suffix="+" />
          <StatCard value={50} label="Team Members" suffix="+" />
        </div>
      </section>

      {/* Services preview */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent font-semibold mb-4">
            <Globe className="w-3 h-3" /> What We Do
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-4">
            Services Built for <span className="text-gradient">Modern Brands</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From social strategy to SaaS products, every service is engineered to drive measurable results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((service) => {
            const Icon = iconMap[service.icon] ?? Share2;
            return (
              <Link key={service.id} href={`/services/${slugify(service.title)}`} data-testid={`card-service-${service.id}`}>
                <div className="card-soft bg-card rounded-2xl p-6 group cursor-pointer h-full">
                  <div className="w-12 h-12 rounded-xl bg-secondary border border-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:border-primary transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">{service.category}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{service.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/services" data-testid="button-view-all-services">
            <Button variant="outline" size="lg" className="border-primary/40 hover:border-primary text-primary hover:bg-secondary rounded-full bg-background">
              View All Services <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-5">
                <TrendingUp className="w-3 h-3" /> Why Social Vista
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">
                We Build Brands That <span className="text-gradient">Dominate</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Social Vista is a next-generation digital agency combining creative strategy with cutting-edge technology. We have helped 200+ brands across the globe amplify their reach, automate their workflows, and build products that scale.
              </p>
              <ul className="space-y-3">
                {["Full-service team — strategy to execution", "AI-powered automation at every step", "Transparent reporting and real-time dashboards", "Dedicated account manager for every client"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground/80">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-8 inline-block" data-testid="button-why-cta">
                <Button className="bg-primary hover:bg-primary/90 text-white mt-8 rounded-full px-6">
                  Let's Talk <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Community Building", desc: "Grow engaged audiences that convert" },
                { icon: TrendingUp, label: "Growth Analytics", desc: "Data-driven decisions at every stage" },
                { icon: Globe, label: "Global Reach", desc: "Multi-platform presence that scales" },
                { icon: Bot, label: "AI Automation", desc: "Smart workflows that save time" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-card card-soft rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="font-semibold text-sm text-foreground mb-1">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-3">
              Trusted by <span className="text-gradient">Top Brands</span>
            </h2>
            <p className="text-muted-foreground">Real results from real clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-card card-soft rounded-2xl p-6" data-testid={`card-testimonial-${t.id}`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-5 text-sm">"{t.message}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-3">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-muted-foreground">Everything you need to know about working with Social Vista.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group bg-card card-soft rounded-2xl px-6">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="w-5 h-5 text-primary shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-muted-foreground text-sm leading-relaxed pb-5 -mt-1">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4">
        <div className="relative overflow-hidden max-w-6xl mx-auto rounded-3xl bg-gradient-brand px-6 py-16 text-center">
          <div className="blob bg-white/20 w-72 h-72 -top-16 -left-10" />
          <div className="blob bg-white/10 w-72 h-72 -bottom-20 -right-10" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-4 text-white">
              Ready to Dominate Your Market?
            </h2>
            <p className="text-white/85 mb-8 text-lg">
              Join 200+ brands that chose Social Vista to grow smarter, faster, and louder.
            </p>
            <Link href="/contact" data-testid="button-final-cta">
              <Button size="lg" className="bg-white hover:bg-white/90 text-primary font-semibold rounded-full px-10 py-6 text-base">
                Start Your Project Today <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
