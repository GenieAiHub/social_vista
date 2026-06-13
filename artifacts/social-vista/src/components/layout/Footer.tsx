import { Link } from "wouter";
import { Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import { slugify } from "@/lib/services-content";
import logoUrl from "@assets/image_e709c6e4_1781263209469.png";

const footerServices = [
  "Social Media Management",
  "WhatsApp Chatbot",
  "Email Marketing",
  "SaaS Development",
  "Crypto & Web3 Projects",
  "Content Creation & Influencer Marketing",
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img src={logoUrl} alt="Social Vista" className="h-[3.75rem] w-auto" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Your full-service digital growth partner. From social media mastery to SaaS development, Web3, and AI-powered automation.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerServices.map((s) => (
                <li key={s}>
                  <Link href={`/services/${slugify(s)}`}>
                    <span className="hover:text-primary transition-colors cursor-pointer">{s}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Services", href: "/services" },
                { label: "Blog", href: "/blog" },
                { label: "Pricing", href: "/pricing" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>
                    <span className="hover:text-primary transition-colors cursor-pointer">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Social Vista. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            AI powered by{" "}
            <a href="https://gnx.co.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              GNX AI (gnx.co.in)
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
