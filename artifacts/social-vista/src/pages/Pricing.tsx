import { Link } from "wouter";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

const plans = [
  {
    name: "Starter",
    tagline: "For brands getting serious about growth",
    price: "Custom",
    highlight: false,
    features: [
      "Social media management (2 platforms)",
      "Content calendar & scheduling",
      "Monthly performance report",
      "Community engagement",
      "Email support",
    ],
  },
  {
    name: "Growth",
    tagline: "Our most popular all-in-one plan",
    price: "Custom",
    highlight: true,
    features: [
      "Everything in Starter, plus:",
      "Social media management (4+ platforms)",
      "WhatsApp chatbot & broadcast campaigns",
      "Email marketing automation",
      "Influencer & content campaigns",
      "Bi-weekly strategy calls",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For brands that need it all, built custom",
    price: "Custom",
    highlight: false,
    features: [
      "Everything in Growth, plus:",
      "SaaS & custom software development",
      "Crypto & Web3 project builds",
      "Dedicated account manager",
      "Custom integrations & automation",
      "Quarterly business reviews",
    ],
  },
];

export default function Pricing() {
  useSEO({
    title: "Pricing — Custom Plans for Every Stage | Social Vista",
    description:
      "Flexible, custom pricing scoped to your goals and budget. Explore Social Vista's Starter, Growth, and Enterprise plans for social media, automation, and development.",
    keywords:
      "social media agency pricing, digital marketing packages, whatsapp automation pricing, agency plans, custom marketing quote",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16">
        <div className="blob bg-secondary w-[480px] h-[480px] -top-24 -left-24" />
        <div className="blob bg-accent/15 w-[420px] h-[420px] top-10 -right-24" />
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif leading-[1.05] mb-6">
            Plans That <span className="text-gradient">Scale With You</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Every business is different, so every plan is custom. Pick a starting point below and we'll tailor it to
            your goals and budget — you only pay for what moves the needle.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col h-full ${
                plan.highlight
                  ? "bg-gradient-brand text-white shadow-2xl md:-mt-4 md:mb-4 relative overflow-hidden"
                  : "card-soft bg-card"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
                  <div className="relative z-10 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-[11px] font-semibold mb-4 self-start">
                    <Sparkles className="w-3.5 h-3.5" /> Most Popular
                  </div>
                </>
              )}
              <div className="relative z-10">
                <h3 className={`text-2xl font-bold font-serif mb-1 ${plan.highlight ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-white/85" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold font-serif ${plan.highlight ? "text-white" : "text-gradient"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>
                    quote
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-white" : "text-primary"}`} />
                      <span className={plan.highlight ? "text-white/90" : "text-muted-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/contact" className="mt-auto relative z-10" data-testid={`link-pricing-${plan.name.toLowerCase()}`}>
                <Button
                  className={`w-full rounded-full font-semibold ${
                    plan.highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-white hover:bg-primary/90 glow-primary"
                  }`}
                >
                  Get a Quote <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10 max-w-xl mx-auto">
          Need something specific? We build custom engagements around any combination of our services. Book a free
          consultation and we'll put together a tailored quote.
        </p>
      </section>

      <Footer />
    </div>
  );
}
