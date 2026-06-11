import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const links = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
            {links.map((l) => (
              <Link key={l.href} href={l.href} data-testid={`link-nav-${l.label.toLowerCase()}`}>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    location === l.href
                      ? "text-primary bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </span>
              </Link>
            ))}
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
          {links.map((l) => (
            <Link key={l.href} href={l.href} data-testid={`link-mobile-${l.label.toLowerCase()}`}>
              <span
                className={`block px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                  location === l.href
                    ? "text-primary bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </span>
            </Link>
          ))}
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
