import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useListServices } from "@workspace/api-client-react";
import { slugify } from "@/lib/services-content";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { data: services } = useListServices();

  const activeServices = (services ?? [])
    .filter((s) => s.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

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
            <span className="flex items-center gap-2 cursor-pointer">
              <Logo className="w-9 h-9 rounded-xl glow-primary" />
              <span className="font-bold text-xl tracking-tight text-gradient font-serif">Social Vista</span>
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

            {/* Services dropdown */}
            <div className="relative group">
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
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-64 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                <div className="bg-background border border-border rounded-2xl shadow-xl p-2">
                  <Link href="/services" data-testid="link-dropdown-all">
                    <span className="block px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:text-primary hover:bg-secondary cursor-pointer">
                      All Services
                    </span>
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  {activeServices.map((s) => (
                    <Link
                      key={s.id}
                      href={`/services/${slugify(s.title)}`}
                      data-testid={`link-dropdown-service-${s.id}`}
                    >
                      <span className="block px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer">
                        {s.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/contact" data-testid="link-nav-contact">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  location === "/contact"
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Contact
              </span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" data-testid="button-get-started">
              <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary text-white font-semibold rounded-full px-5">
                Get Started
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
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2 shadow-sm">
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
            <div className="ml-3 mt-1 pl-3 border-l border-border space-y-1">
              {activeServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${slugify(s.title)}`}
                  data-testid={`link-mobile-service-${s.id}`}
                >
                  <span
                    className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    {s.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/contact" data-testid="link-mobile-contact">
            <span
              className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                location === "/contact"
                  ? "text-primary bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setOpen(false)}
            >
              Contact
            </span>
          </Link>

          <Link href="/contact">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white mt-2 rounded-full" onClick={() => setOpen(false)}>
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
