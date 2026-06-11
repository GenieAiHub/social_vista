import { Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useListServices } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool,
};

const categoryColors: Record<string, string> = {
  "Social Media": "text-pink-400 bg-pink-400/10 border-pink-400/20",
  "Automation": "text-green-400 bg-green-400/10 border-green-400/20",
  "Productivity": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Development": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Web3": "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export default function Services() {
  const { data: services, isLoading } = useListServices();
  const active = services?.filter(s => s.active) ?? [];

  const categories = Array.from(new Set(active.map(s => s.category)));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-16 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-5">
            Our Offerings
          </div>
          <h1 className="text-5xl font-bold font-serif mb-5">
            Services That <span className="text-gradient">Drive Results</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Every service is built around one goal: making your brand grow faster, work smarter, and stand out louder.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {categories.map((cat) => {
              const catServices = active.filter(s => s.category === cat);
              return (
                <div key={cat} className="mb-14">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${categoryColors[cat] ?? "text-primary bg-primary/10 border-primary/20"}`}>
                      {cat}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catServices.map((service) => {
                      const Icon = iconMap[service.icon] ?? Share2;
                      return (
                        <div
                          key={service.id}
                          className="card-glow bg-card rounded-2xl p-6 group hover:bg-card/80 transition-colors"
                          data-testid={`card-service-${service.id}`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-3">{service.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                          <Link href="/contact" data-testid={`button-service-cta-${service.id}`}>
                            <button className="mt-5 text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                              Get Started <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border py-20 bg-card/20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-serif mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-muted-foreground mb-8">
            Tell us about your goals — we will build a custom plan that fits your business perfectly.
          </p>
          <Link href="/contact" data-testid="button-services-contact-cta">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold glow-primary">
              Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
