import { Share2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useListServices } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { iconMap, slugify, serviceContent } from "@/lib/services-content";

const categoryColors: Record<string, string> = {
  "Social Media": "text-primary bg-secondary border-primary/20",
  "Automation": "text-emerald-600 bg-emerald-50 border-emerald-200",
  "Productivity": "text-blue-600 bg-blue-50 border-blue-200",
  "Development": "text-accent bg-accent/10 border-accent/20",
  "Web3": "text-amber-600 bg-amber-50 border-amber-200",
  "Marketing": "text-rose-600 bg-rose-50 border-rose-200",
};

export default function Services() {
  const { data: services, isLoading } = useListServices();
  const active = services?.filter(s => s.active) ?? [];
  const categories = Array.from(new Set(active.map(s => s.category)));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-16 text-center relative overflow-hidden">
        <div className="blob bg-secondary w-[500px] h-[320px] -top-10 left-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold mb-5">
            Our Offerings
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-5">
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
              <div key={i} className="bg-muted rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {categories.map((cat) => {
              const catServices = active.filter(s => s.category === cat);
              return (
                <div key={cat} className="mb-14">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${categoryColors[cat] ?? "text-primary bg-secondary border-primary/20"}`}>
                      {cat}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catServices.map((service) => {
                      const Icon = iconMap[service.icon] ?? Share2;
                      const slug = slugify(service.title);
                      const img = serviceContent[slug]?.image;
                      return (
                        <Link key={service.id} href={`/services/${slug}`} data-testid={`card-service-${service.id}`}>
                          <div className="card-soft bg-card rounded-2xl overflow-hidden group cursor-pointer h-full flex flex-col">
                            {img && (
                              <div className="relative bg-secondary/40 aspect-[4/3] overflow-hidden">
                                <img src={img} alt={service.title} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                              </div>
                            )}
                            <div className="p-6 flex flex-col flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary border border-primary/15 flex items-center justify-center group-hover:bg-primary transition-colors">
                                  <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed flex-1">{service.description}</p>
                              <span className="mt-5 inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                                Explore service <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </Link>
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
      <section className="border-t border-border py-20 bg-muted/40">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-serif mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-muted-foreground mb-8">
            Tell us about your goals — we will build a custom plan that fits your business perfectly.
          </p>
          <Link href="/contact" data-testid="button-services-contact-cta">
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
