import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, ArrowRight, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/image_e709c6e4_1781263209469.png";
import { useListServices } from "@workspace/api-client-react";
import { iconMap, slugify } from "@/lib/services-content";

const categoryAccent: Record<string, string> = {
  "Social Media": "text-primary",
  "Automation": "text-emerald-600",
  "Productivity": "text-blue-600",
  "Development": "text-accent",
  "Web3": "text-amber-600",
  "Marketing": "text-rose-600",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { data: services } = useListServices();

  const activeServices = (services ?? [])
    .filter((s) => s.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const categories = Array.from(new Set(activeServices.map((s) => s.category)));
  const grouped = categories.map((cat) => ({
    cat,
    items: activeServices.filter((s) => s.category === cat),
  }));

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isServices = location.startsWith("/services");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" data-testid="link-logo">
            <span className="flex items-center cursor-pointer">
              <img src={logoUrl} alt="Social Vista" className="h-[3.375rem] w-auto" />
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" data-testid="link-nav-home">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location === "/"
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Home
              </span>
            </Link>

            {/* Services mega menu */}
            <div className="static md:relative group">
              <Link href="/services" data-testid="link-nav-services">
                <span
                  className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    isServices
                      ? "text-primary bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Services
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                </span>
              </Link>

              {/* Mega panel */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[min(940px,92vw)] opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
                <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden grid grid-cols-12">
                  {/* Category columns */}
                  <div className="col-span-12 lg:col-span-8 p-6 grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
                    {grouped.map(({ cat, items }) => (
                      <div key={cat}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${categoryAccent[cat] ?? "text-primary"}`}>
                          {cat}
                        </p>
                        <ul className="space-y-1">
                          {items.map((s) => {
                            const Icon = iconMap[s.icon] ?? Share2;
                            return (
                              <li key={s.id}>
                                <Link href={`/services/${slugify(s.title)}`} data-testid={`link-mega-service-${s.id}`}>
                                  <span className="flex items-start gap-2.5 rounded-xl p-2 -mx-2 hover:bg-secondary transition-colors cursor-pointer group/item">
                                    <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-secondary border border-primary/15 flex items-center justify-center group-hover/item:bg-primary transition-colors">
                                      <Icon className="w-4 h-4 text-primary group-hover/item:text-white transition-colors" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block text-sm font-medium text-foreground leading-tight">{s.title}</span>
                                      <span className="block text-xs text-muted-foreground truncate">{s.description}</span>
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Promo rail */}
                  <div className="hidden lg:flex col-span-4 bg-gradient-brand text-white p-6 flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-[11px] font-semibold mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> Full-Service Agency
                      </div>
                      <h4 className="text-xl font-bold font-serif leading-snug mb-2">
                        Not sure which service fits?
                      </h4>
                      <p className="text-sm text-white/85 leading-relaxed">
                        Tell us your goals and we'll craft a custom growth plan tailored to your business.
                      </p>
                    </div>
                    <div className="relative z-10 mt-6 space-y-2">
                      <Link href="/contact" data-testid="link-mega-cta">
                        <span className="flex items-center justify-center gap-2 bg-white text-primary font-semibold text-sm rounded-full px-4 py-2.5 hover:bg-white/90 transition-colors cursor-pointer">
                          Book a Free Consultation <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                      <Link href="/services" data-testid="link-mega-all">
                        <span className="flex items-center justify-center gap-1.5 text-white/90 hover:text-white text-sm font-medium px-4 py-2 cursor-pointer transition-colors">
                          View All Services
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/about" data-testid="link-nav-about">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location === "/about"
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                About
              </span>
            </Link>

            <Link href="/blog" data-testid="link-nav-blog">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location.startsWith("/blog")
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Blog
              </span>
            </Link>

            <Link href="/pricing" data-testid="link-nav-pricing">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location === "/pricing"
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Pricing
              </span>
            </Link>

            <Link href="/contact" data-testid="link-nav-contact">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location === "/contact"
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Contact Us
              </span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" data-testid="button-get-started">
              <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary text-white font-semibold rounded-full px-5">
                Free Consultation
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setOpen(!open)}
            data-testid="button-mobile-menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2 shadow-sm max-h-[80vh] overflow-y-auto">
          <Link href="/" data-testid="link-mobile-home">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === "/"
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              Home
            </span>
          </Link>

          <div>
            <Link href="/services" data-testid="link-mobile-services">
              <span
                className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                  isServices
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setOpen(false)}
              >
                Services
              </span>
            </Link>
            <div className="ml-3 mt-1 pl-3 border-l border-border space-y-3 py-1">
              {grouped.map(({ cat, items }) => (
                <div key={cat}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 px-3 ${categoryAccent[cat] ?? "text-primary"}`}>
                    {cat}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((s) => {
                      const Icon = iconMap[s.icon] ?? Share2;
                      return (
                        <Link key={s.id} href={`/services/${slugify(s.title)}`} data-testid={`link-mobile-service-${s.id}`}>
                          <span
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer"
                            onClick={() => setOpen(false)}
                          >
                            <Icon className="w-4 h-4 shrink-0 text-primary" />
                            {s.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/about" data-testid="link-mobile-about">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === "/about"
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              About
            </span>
          </Link>

          <Link href="/blog" data-testid="link-mobile-blog">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location.startsWith("/blog")
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              Blog
            </span>
          </Link>

          <Link href="/pricing" data-testid="link-mobile-pricing">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === "/pricing"
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              Pricing
            </span>
          </Link>

          <Link href="/contact" data-testid="link-mobile-contact">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === "/contact"
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              Contact Us
            </span>
          </Link>

          <Link href="/contact">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white mt-2 rounded-full" onClick={() => setOpen(false)}>
              Free Consultation
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
