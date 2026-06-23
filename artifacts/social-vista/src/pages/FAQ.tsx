import { Link } from "wouter";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/hooks/use-seo";

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
  {
    q: "Do you offer one-off projects or only ongoing retainers?",
    a: "Both. Some clients engage us for a single project — like a SaaS build, a Web3 launch, or a campaign — while others prefer ongoing monthly retainers for continuous growth. We'll recommend the structure that fits your goals.",
  },
  {
    q: "Which platforms and channels do you manage?",
    a: "We work across all major platforms including Instagram, Facebook, TikTok, X, LinkedIn, YouTube, and WhatsApp, plus email and your own website or app. We meet your audience wherever they already spend their time.",
  },
  {
    q: "Can you work with our existing team and tools?",
    a: "Yes. We act as an extension of your team and integrate with the tools you already use. Whether you need us to lead or to fill specific gaps, we adapt to your workflow.",
  },
];

export default function FAQ() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = origin + import.meta.env.BASE_URL.replace(/\/$/, "");

  usePageSEO("faq", {
    title: "FAQ — Frequently Asked Questions | Social Vista",
    description:
      "Answers to common questions about Social Vista's services, pricing, onboarding, reporting, and how we help brands grow with social media, automation, and development.",
    keywords:
      "social vista faq, digital agency questions, pricing, onboarding, social media agency faq",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      url: `${siteUrl}/faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16">
        <div className="blob bg-secondary w-[480px] h-[480px] -top-24 -left-24" />
        <div className="blob bg-accent/15 w-[420px] h-[420px] top-10 -right-24" />
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Frequently Asked Questions
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif leading-[1.05] mb-6">
            Questions? <span className="text-gradient">We've Got Answers</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about working with Social Vista. Can't find what you're looking for? Reach out
            and we'll help.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group card-soft bg-card rounded-2xl overflow-hidden"
              data-testid={`faq-item-${i}`}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 md:p-6">
                <span className="font-semibold text-foreground text-sm md:text-base">{f.q}</span>
                <ChevronDown className="w-5 h-5 text-primary shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 md:px-6 pb-5 md:pb-6 -mt-1">
                <p className="text-muted-foreground text-sm leading-relaxed">{f.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="card-soft bg-card rounded-2xl p-8 mt-10 text-center">
          <h3 className="text-xl font-bold font-serif mb-3">Still have questions?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Book a free consultation and we'll answer everything and map out your growth plan.
          </p>
          <Link href="/contact" data-testid="link-faq-cta">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary rounded-full px-8">
              Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
