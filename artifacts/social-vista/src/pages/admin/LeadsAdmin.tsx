import { useState } from "react";
import { format } from "date-fns";
import { Mail, Phone, Calendar, Users, Trash2, MessageSquare, Target } from "lucide-react";
import {
  useListLeads,
  useUpdateLead,
  useDeleteLead,
  useListStaff,
  getListLeadsQueryKey,
  getGetAdminStatsQueryKey,
  type Lead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["new", "contacted", "booked", "closed"] as const;
type Status = (typeof STATUSES)[number];

const statusStyles: Record<string, string> = {
  new: "bg-primary/20 text-primary border-primary/30",
  contacted: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  booked: "bg-green-400/15 text-green-400 border-green-400/30",
  closed: "bg-muted text-muted-foreground border-border",
};

function LeadCard({
  lead,
  staff,
  onChanged,
}: {
  lead: Lead;
  staff: { id: number; name: string }[];
  onChanged: () => void;
}) {
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [notes, setNotes] = useState(lead.adminNotes ?? "");

  function patch(data: { status?: Status; assignedTo?: number | null; adminNotes?: string }) {
    updateLead.mutate({ id: lead.id, data }, { onSuccess: onChanged });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5" data-testid={`card-lead-${lead.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{lead.name}</span>
              <Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[lead.status] ?? ""}`}>{lead.status}</Badge>
              <Badge variant="secondary" className="text-[10px] capitalize">{lead.source}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <Mail className="w-3 h-3" /> {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <Phone className="w-3 h-3" /> {lead.phone}
                </a>
              )}
            </div>
            {lead.serviceInterest && (
              <p className="flex items-center gap-1.5 text-xs text-foreground/80 mt-2">
                <Target className="w-3 h-3 text-primary" /> {lead.serviceInterest}
              </p>
            )}
            {lead.preferredTime && (
              <p className="flex items-center gap-1.5 text-xs text-foreground/80 mt-1">
                <Calendar className="w-3 h-3 text-primary" /> Preferred: {lead.preferredTime}
              </p>
            )}
            {lead.message && (
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{lead.message}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(lead.createdAt), "MMM d, yyyy")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => deleteLead.mutate({ id: lead.id }, { onSuccess: onChanged })}
            disabled={deleteLead.isPending}
            data-testid={`button-delete-lead-${lead.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Status</label>
          <Select value={lead.status} onValueChange={(v) => patch({ status: v as Status })}>
            <SelectTrigger className="mt-1 h-9" data-testid={`select-lead-status-${lead.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Assigned to</label>
          <Select
            value={lead.assignedTo != null ? String(lead.assignedTo) : "unassigned"}
            onValueChange={(v) => patch({ assignedTo: v === "unassigned" ? null : Number(v) })}
          >
            <SelectTrigger className="mt-1 h-9" data-testid={`select-lead-assignee-${lead.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staff.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Internal notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note for the team…"
          className="mt-1 min-h-[60px] text-sm"
          data-testid={`textarea-lead-notes-${lead.id}`}
        />
        {notes !== (lead.adminNotes ?? "") && (
          <Button
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={() => patch({ adminNotes: notes })}
            disabled={updateLead.isPending}
            data-testid={`button-save-notes-${lead.id}`}
          >
            Save note
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LeadsAdmin() {
  const { data: leads, isLoading } = useListLeads();
  const { data: staff } = useListStaff();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  }

  const staffList = (staff ?? []).map((s) => ({ id: s.id, name: s.name }));

  const filtered = (leads ?? []).filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    return true;
  });

  const newCount = (leads ?? []).filter((l) => l.status === "new").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {newCount > 0 ? <span className="text-primary font-medium">{newCount} new</span> : "All caught up"} · {leads?.length ?? 0} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-[140px]" data-testid="select-filter-source"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="contact">Contact form</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-32" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {leads?.length ? "No leads match these filters." : "No leads yet. They'll appear here from the chat assistant and contact form."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <LeadCard key={lead.id} lead={lead} staff={staffList} onChanged={invalidate} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
