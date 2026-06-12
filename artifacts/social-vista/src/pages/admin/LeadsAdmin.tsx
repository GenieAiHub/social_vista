import { useState } from "react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { Mail, Phone, Calendar, Users, Trash2, Target, Send, Clock, CheckCircle2, AlertTriangle, History, ArrowRightLeft, UserCheck, StickyNote, Activity as ActivityIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  useListLeads,
  useUpdateLead,
  useDeleteLead,
  useReplyToLead,
  useListStaff,
  useListLeadActivities,
  useCreateLeadActivity,
  getListLeadsQueryKey,
  getListLeadActivitiesQueryKey,
  getGetAdminStatsQueryKey,
  type Lead,
  type LeadActivity,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["new", "contacted", "booked", "closed"] as const;
type Status = (typeof STATUSES)[number];

const statusStyles: Record<string, string> = {
  new: "bg-primary/20 text-primary border-primary/30",
  contacted: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  booked: "bg-green-400/15 text-green-400 border-green-400/30",
  closed: "bg-muted text-muted-foreground border-border",
};

// A lead "needs follow-up" when it's still open (not booked/closed) and has gone
// too long without contact: 3+ days if never contacted, 7+ days since last touch.
function isLeadStale(lead: Lead): boolean {
  if (lead.status === "booked" || lead.status === "closed") return false;
  const lastContacted = lead.lastContactedAt ? new Date(lead.lastContactedAt) : null;
  if (!lastContacted) return differenceInDays(new Date(), new Date(lead.createdAt)) >= 3;
  return differenceInDays(new Date(), lastContacted) >= 7;
}

// Effective "last touch" time for sorting: last contacted, falling back to when
// the lead was created (never-contacted leads sort as the oldest contact).
function effectiveContactTime(lead: Lead): number {
  return lead.lastContactedAt
    ? new Date(lead.lastContactedAt).getTime()
    : new Date(lead.createdAt).getTime();
}

function ReplyDialog({ lead, onReplied }: { lead: Lead; onReplied: () => void }) {
  const replyToLead = useReplyToLead();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Re: your inquiry with Social Vista`);
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Subject and message are required.", variant: "destructive" });
      return;
    }
    replyToLead.mutate(
      { id: lead.id, data: { subject, message } },
      {
        onSuccess: () => {
          toast({ title: `Reply sent to ${lead.name}.` });
          setOpen(false);
          setMessage("");
          onReplied();
        },
        onError: () =>
          toast({
            title: "Could not send the reply. Check the email configuration.",
            variant: "destructive",
          }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          data-testid={`button-reply-lead-${lead.id}`}
        >
          <Send className="w-3.5 h-3.5 mr-1" /> Reply
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to {lead.name}</DialogTitle>
          <DialogDescription>
            Sends an email to {lead.email} and marks this lead as contacted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor={`reply-subject-${lead.id}`}>Subject</Label>
            <Input
              id={`reply-subject-${lead.id}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              data-testid={`input-reply-subject-${lead.id}`}
            />
          </div>
          <div>
            <Label htmlFor={`reply-message-${lead.id}`}>Message</Label>
            <Textarea
              id={`reply-message-${lead.id}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${lead.name}, thanks for reaching out…`}
              className="mt-1 min-h-[140px]"
              data-testid={`textarea-reply-message-${lead.id}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={replyToLead.isPending}
            data-testid={`button-send-reply-${lead.id}`}
          >
            {replyToLead.isPending ? "Sending…" : "Send reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const activityMeta: Record<string, { icon: typeof History; label: string; color: string }> = {
  status_change: { icon: ArrowRightLeft, label: "Status change", color: "text-primary" },
  assignment: { icon: UserCheck, label: "Assignment", color: "text-accent" },
  note: { icon: StickyNote, label: "Note", color: "text-amber-400" },
  contacted: { icon: CheckCircle2, label: "Contacted", color: "text-green-400" },
  email: { icon: Send, label: "Email reply", color: "text-blue-400" },
  log: { icon: ActivityIcon, label: "Log", color: "text-muted-foreground" },
};

function TimelineEntry({ activity }: { activity: LeadActivity }) {
  const meta = activityMeta[activity.type] ?? activityMeta.log;
  const Icon = meta.icon;
  return (
    <li className="flex gap-3" data-testid={`activity-${activity.id}`}>
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className={`w-3 h-3 ${meta.color}`} />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">{meta.label}</span>
          <span
            className="text-[11px] text-muted-foreground"
            title={format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
          >
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
          {activity.authorName && (
            <span className="text-[11px] text-muted-foreground">· {activity.authorName}</span>
          )}
        </div>
        {activity.note && (
          <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed break-words">{activity.note}</p>
        )}
      </div>
    </li>
  );
}

function LeadTimeline({ leadId, onChanged }: { leadId: number; onChanged: () => void }) {
  const { data: activities, isLoading } = useListLeadActivities(leadId);
  const createActivity = useCreateLeadActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: getListLeadActivitiesQueryKey(leadId) });
    onChanged();
  }

  function handleAdd() {
    if (!note.trim()) {
      toast({ title: "Enter a note to log.", variant: "destructive" });
      return;
    }
    createActivity.mutate(
      { id: leadId, data: { note: note.trim(), type: "log" } },
      {
        onSuccess: () => {
          setNote("");
          refresh();
        },
        onError: () => toast({ title: "Could not save the log entry.", variant: "destructive" }),
      },
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Activity timeline</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log a call, meeting, or other touchpoint…"
          className="min-h-[40px] text-sm"
          data-testid={`textarea-activity-note-${leadId}`}
        />
        <Button
          size="sm"
          className="h-9 text-xs flex-shrink-0"
          onClick={handleAdd}
          disabled={createActivity.isPending}
          data-testid={`button-add-activity-${leadId}`}
        >
          Log
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="[&>li:last-child>div:first-child>div:last-child]:hidden" data-testid={`timeline-${leadId}`}>
          {activities.map((a) => (
            <TimelineEntry key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [showTimeline, setShowTimeline] = useState(false);

  function patch(data: { status?: Status; assignedTo?: number | null; adminNotes?: string; markContacted?: boolean }) {
    updateLead.mutate({ id: lead.id, data }, { onSuccess: onChanged });
  }

  const lastContacted = lead.lastContactedAt ? new Date(lead.lastContactedAt) : null;
  const isStale = isLeadStale(lead);

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
              {isStale && (
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 gap-1" data-testid={`badge-lead-stale-${lead.id}`}>
                  <AlertTriangle className="w-2.5 h-2.5" /> Needs follow-up
                </Badge>
              )}
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
          <span
            className={`flex items-center gap-1 text-xs whitespace-nowrap ${isStale ? "text-destructive" : "text-muted-foreground"}`}
            title={lastContacted ? format(lastContacted, "MMM d, yyyy 'at' h:mm a") : undefined}
            data-testid={`text-lead-last-contacted-${lead.id}`}
          >
            <Clock className="w-3 h-3" />
            {lastContacted ? `Contacted ${formatDistanceToNow(lastContacted, { addSuffix: true })}` : "Never contacted"}
          </span>
          <div className="flex items-center gap-1.5">
            {lead.email && <ReplyDialog lead={lead} onReplied={onChanged} />}
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

      <div className="mt-3 pt-3 border-t border-border flex justify-between items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5 text-muted-foreground"
          onClick={() => setShowTimeline((v) => !v)}
          data-testid={`button-toggle-timeline-${lead.id}`}
        >
          <History className="w-3.5 h-3.5" />
          {showTimeline ? "Hide timeline" : "View timeline"}
          {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={() => patch({ markContacted: true })}
          disabled={updateLead.isPending}
          data-testid={`button-mark-contacted-${lead.id}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark contacted now
        </Button>
      </div>

      {showTimeline && <LeadTimeline leadId={lead.id} onChanged={onChanged} />}
    </div>
  );
}

export default function LeadsAdmin() {
  const { data: leads, isLoading } = useListLeads();
  const { data: staff } = useListStaff();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest_contact">("newest");
  const [followUpOnly, setFollowUpOnly] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  }

  const staffList = (staff ?? []).map((s) => ({ id: s.id, name: s.name }));

  const filtered = (leads ?? [])
    .filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (followUpOnly && !isLeadStale(l)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest_contact") {
        return effectiveContactTime(a) - effectiveContactTime(b);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const newCount = (leads ?? []).filter((l) => l.status === "new").length;
  const followUpCount = (leads ?? []).filter(isLeadStale).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {newCount > 0 ? <span className="text-primary font-medium">{newCount} new</span> : "All caught up"} · {leads?.length ?? 0} total
              {followUpCount > 0 && (
                <>
                  {" · "}
                  <span className="text-destructive font-medium" data-testid="text-followup-count">
                    {followUpCount} need{followUpCount === 1 ? "s" : ""} follow-up
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={followUpOnly ? "default" : "outline"}
              className="h-9 gap-1.5"
              onClick={() => setFollowUpOnly((v) => !v)}
              data-testid="button-filter-followup"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs follow-up{followUpCount > 0 ? ` (${followUpCount})` : ""}
            </Button>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-9 w-[170px]" data-testid="select-sort"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest_contact">Oldest contact first</SelectItem>
              </SelectContent>
            </Select>
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
