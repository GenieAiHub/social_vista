import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, FileText, MessageSquare, Palette, LogOut, Zap, Menu, X, Users, UserCog } from "lucide-react";
import { useState } from "react";
import { clearAuth, getStoredUser } from "@/lib/admin-auth";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ownerOnly: false },
  { label: "Leads", href: "/admin/leads", icon: Users, ownerOnly: false },
  { label: "Services", href: "/admin/services", icon: Settings, ownerOnly: false },
  { label: "Content", href: "/admin/content", icon: FileText, ownerOnly: false },
  { label: "Contacts", href: "/admin/contacts", icon: MessageSquare, ownerOnly: false },
  { label: "Theme", href: "/admin/theme", icon: Palette, ownerOnly: false },
  { label: "Staff", href: "/admin/staff", icon: UserCog, ownerOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();
  const isOwner = user?.role === "owner";
  const visibleNav = navItems.filter((item) => !item.ownerOnly || isOwner);

  function logout() {
    clearAuth();
    setLocation("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
          <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="font-bold text-lg text-gradient font-serif">Social Vista</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-3 font-medium">CMS</p>
          {visibleNav.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} data-testid={`link-admin-${label.toLowerCase()}`}>
              <span
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  location === href
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-sidebar-toggle"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm text-muted-foreground font-medium">Admin Portal</span>
          <div className="ml-auto flex items-center gap-3">
            {user?.name && <span className="text-sm text-foreground font-medium hidden sm:inline">{user.name}</span>}
            <span className="text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-full font-medium capitalize">{user?.role ?? "Staff"}</span>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
