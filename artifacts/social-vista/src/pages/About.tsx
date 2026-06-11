import { Link } from "wouter";
import { ArrowRight, Target, Heart, Zap, Users, TrendingUp, Sparkles, CheckCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

const values = [
  {
    icon: Target,
    title: "Results Over Vanity",
    desc: "We tie every campaign to outcomes that matter — leads, revenue, and growth — not just likes and impressions.",
  },
  {
    icon: Heart,
    title: "Partnership First",
    desc: "We act as an extension of your team. Your goals become our goals, and your wins become our wins.",
  },
  {
    icon: Zap,
    title: "Speed & Innovation",
    desc: "We move fast and bring the latest in AI and automation so you stay ahead of the competition.",
  },
  {
    icon: Users,
    title: "Transparency Always",
    desc: "Clear reporting, honest advice, and no jargon. You always know exactly what we're doing and why.",
  },
];

const milestones = [
  { value: "200+", label: "Brands Served" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "5+", label: "Years of Experience" },
  { value: "50+", label: "Team Members" },
];

export default function About() {
  useSEO({
    title: "About Social Vista — Your Full-Service Digital Growth Partner",
    description:
      "Learn about Social Vista, a full-service digital agency combining creative strategy with AI-powered automation. Discover our mission, values, and the team driving brand growth worldwide.",
    keywords:
      "about social vista, digital marketing agency, our mission, agency values, growth partner, social media agency team",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16">
        <div className="blob bg-secondary w-[480px] h-[480px] -top-24 -left-24" />
        <div className="blob bg-accent/15 w-[420px] h-[420px] top-10 -right-24" />
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> About Social Vista
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif leading-[1.05] mb-6">
            We Help Brands <span className="text-gradient">Grow Smarter</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Social Vista is a full-service digital agency built for modern brands. We bring strategy, content,
            technology, and AI-powered automation together under one roof — so you can grow louder, convert faster,
            and lead boldly.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {milestones.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-4xl font-bold text-gradient font-serif">{m.value}</div>
              <div className="text-muted-foreground text-sm mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent font-semibold mb-5">
              <TrendingUp className="w-3 h-3" /> Our Story
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6">
              One team for every part of your digital growth
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Social Vista was founded on a simple frustration: brands were forced to juggle a dozen vendors — one
                for social, one for ads, another for development, another for automation — with no one owning the
                bigger picture.
              </p>
              <p>
                We built a different kind of agency. A single partner that handles strategy, content, technology, and
                reporting end to end, powered by the latest in AI and automation. From scrappy startups to established
                brands, we scope every plan to real goals and real budgets.
              </p>
              <p>
                Today we serve clients across the globe — but our mission hasn't changed. We exist to turn your
                ambition into measurable, compounding growth.
              </p>
            </div>
            <Link href="/contact" data-testid="link-about-cta">
              <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
                Work With Us <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {[
              "Full-service strategy, content, and development",
              "AI-powered automation built into every engagement",
              "Transparent monthly reporting tied to real KPIs",
              "Custom plans scoped to your goals and budget",
              "A dedicated team that acts as an extension of yours",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 card-soft bg-card rounded-2xl p-5">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-serif mb-4">
              What We <span className="text-gradient">Stand For</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The principles that guide every decision, every campaign, and every client relationship.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="card-soft bg-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-secondary border border-primary/15 flex items-center justify-center mb-5">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-serif mb-5">
          Ready to grow with a partner who gets it?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Book a free consultation and we'll craft a custom growth plan tailored to your business.
        </p>
        <Link href="/contact" data-testid="link-about-bottom-cta">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
            Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
