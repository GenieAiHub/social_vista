import { format } from "date-fns";
import { Link } from "wouter";
import { Mail, Settings, TrendingUp, MailOpen, CheckCircle, Users, Sparkles } from "lucide-react";
import { useGetAdminStats, useListContacts, useListLeads, useMarkContactRead, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: contacts } = useListContacts();
  const { data: leads } = useListLeads();
  const markRead = useMarkContactRead();
  const queryClient = useQueryClient();

  const recent = contacts?.slice(0, 5) ?? [];
  const recentLeads = leads?.slice(0, 5) ?? [];

  function handleMarkRead(id: number) {
    markRead.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() }) }
    );
  }

  const statCards = [
    { label: "Total Leads", value: stats?.totalLeads ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "New Leads", value: stats?.newLeads ?? 0, icon: Sparkles, color: "text-pink-400", bg: "bg-pink-400/10" },
    { label: "Total Contacts", value: stats?.totalContacts ?? 0, icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Unread Messages", value: stats?.unreadContacts ?? 0, icon: MailOpen, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Total Services", value: stats?.totalServices ?? 0, icon: Settings, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Active Services", value: stats?.activeServices ?? 0, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back — here's what's happening.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-xl p-5 border border-border" data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold font-serif text-foreground">{value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Recent leads */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Leads</h2>
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="link-view-all-leads">View all</Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentLeads.length === 0 ? (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No leads yet — the AI assistant and contact form will fill this up.</div>
            ) : (
              recentLeads.map((l) => (
                <div key={l.id} className={`px-6 py-4 flex items-start justify-between gap-4 ${l.status === "new" ? "bg-primary/5" : ""}`} data-testid={`row-lead-${l.id}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {l.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{l.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{l.status}</Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">{l.source}</Badge>
                      </div>
                      {l.serviceInterest && <div className="text-xs text-foreground/70 mt-1">{l.serviceInterest}</div>}
                      {l.message && <div className="text-xs text-foreground/70 mt-1 truncate max-w-xs">{l.message}</div>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {format(new Date(l.createdAt), "MMM d")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent contacts */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Inquiries</h2>
            <Badge variant="secondary" className="text-xs">{contacts?.length ?? 0} total</Badge>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-muted-foreground text-sm">No contact submissions yet.</div>
            ) : (
              recent.map((c) => (
                <div key={c.id} className={`px-6 py-4 flex items-start justify-between gap-4 ${!c.isRead ? "bg-primary/5" : ""}`} data-testid={`row-contact-${c.id}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{c.name}</span>
                        {!c.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      <div className="text-xs text-foreground/70 mt-1 truncate max-w-xs">{c.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.createdAt), "MMM d")}
                    </span>
                    {!c.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleMarkRead(c.id)}
                        disabled={markRead.isPending}
                        data-testid={`button-mark-read-${c.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
