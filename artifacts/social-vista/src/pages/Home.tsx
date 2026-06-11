import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool, Star, TrendingUp, Users, Globe, CheckCircle } from "lucide-react";
import { SiInstagram, SiX, SiFacebook, SiTiktok } from "react-icons/si";
import { Linkedin } from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.png";

const iconMap: Record<string, React.ElementType> = {
  Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool,
};

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-16">
        {/* Background image */}
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {/* Readability overlay */}
        <div className="absolute inset-0 bg-background/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold font-serif tracking-tight mb-6 leading-none">
            Grow Louder.{" "}
            <span className="text-gradient">Convert Faster.</span>
            <br />Lead Boldly.
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Social Vista is your full-service digital growth partner — from social media mastery to SaaS development, Web3, and AI-powered automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" data-testid="button-hero-cta">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary px-8">
                Start Your Project <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/services" data-testid="button-hero-services">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/50 font-semibold px-8">
                Explore Services
              </Button>
            </Link>
          </div>

          {/* Platform logos */}
          <div className="flex items-center justify-center gap-6 mt-14 text-muted-foreground/50">
            <SiInstagram className="w-5 h-5 hover:text-pink-500 transition-colors cursor-default" />
            <SiFacebook className="w-5 h-5 hover:text-blue-500 transition-colors cursor-default" />
            <SiX className="w-5 h-5 hover:text-foreground transition-colors cursor-default" />
            <Linkedin className="w-5 h-5 hover:text-blue-400 transition-colors cursor-default" />
            <SiTiktok className="w-5 h-5 hover:text-foreground transition-colors cursor-default" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-card/30">
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
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 text-xs text-accent font-medium mb-4">
            <Globe className="w-3 h-3" /> What We Do
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">
            Services Built for <span className="text-gradient">Modern Brands</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From social strategy to SaaS products, every service is engineered to drive measurable results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((service, i) => {
            const Icon = iconMap[service.icon] ?? Share2;
            return (
              <div
                key={service.id}
                className="card-glow bg-card rounded-2xl p-6 group"
                style={{ animationDelay: `${i * 80}ms` }}
                data-testid={`card-service-${service.id}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">{service.category}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{service.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/services" data-testid="button-view-all-services">
            <Button variant="outline" size="lg" className="border-primary/40 hover:border-primary text-primary hover:bg-primary/10">
              View All Services <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-card/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-5">
                <TrendingUp className="w-3 h-3" /> Why Social Vista
              </div>
              <h2 className="text-4xl font-bold font-serif mb-6">
                We Build Brands That <span className="text-gradient">Dominate</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Social Vista is a next-generation digital agency combining creative strategy with cutting-edge technology. We have helped 200+ brands across the globe amplify their reach, automate their workflows, and build products that scale.
              </p>
              <ul className="space-y-3">
                {["Full-service team — strategy to execution", "AI-powered automation at every step", "Transparent reporting and real-time dashboards", "Dedicated account manager for every client"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-8 inline-block" data-testid="button-why-cta">
                <Button className="bg-primary hover:bg-primary/90 text-white mt-8">
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
                <div key={label} className="bg-card card-glow rounded-xl p-5">
                  <Icon className="w-6 h-6 text-accent mb-3" />
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
            <h2 className="text-4xl font-bold font-serif mb-3">
              Trusted by <span className="text-gradient">Top Brands</span>
            </h2>
            <p className="text-muted-foreground">Real results from real clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-card card-glow rounded-2xl p-6" data-testid={`card-testimonial-${t.id}`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-5 text-sm">"{t.message}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
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

      {/* CTA Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">
            Ready to Dominate <span className="text-gradient">Your Market?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join 200+ brands that chose Social Vista to grow smarter, faster, and louder.
          </p>
          <Link href="/contact" data-testid="button-final-cta">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary px-10 py-6 text-base">
              Start Your Project Today <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
