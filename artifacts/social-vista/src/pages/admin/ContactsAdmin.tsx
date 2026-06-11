import { format } from "date-fns";
import { CheckCircle, Mail, Phone, MessageSquare } from "lucide-react";
import { useListContacts, useMarkContactRead, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ContactsAdmin() {
  const { data: contacts, isLoading } = useListContacts();
  const markRead = useMarkContactRead();
  const queryClient = useQueryClient();

  function handleMarkRead(id: number) {
    markRead.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() }) }
    );
  }

  const unread = contacts?.filter(c => !c.isRead).length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Contact Submissions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unread > 0 ? <span className="text-primary font-medium">{unread} unread</span> : "All read"} · {contacts?.length ?? 0} total
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-24" />
            ))}
          </div>
        ) : contacts?.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No contact submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts?.map((c) => (
              <div
                key={c.id}
                className={`bg-card rounded-xl border p-5 transition-colors ${!c.isRead ? "border-primary/30 bg-primary/5" : "border-border"}`}
                data-testid={`card-contact-${c.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        {!c.isRead && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">New</Badge>}
                        {c.service && <Badge variant="secondary" className="text-[10px]">{c.service}</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{c.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </span>
                    {!c.isRead ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleMarkRead(c.id)}
                        disabled={markRead.isPending}
                        data-testid={`button-mark-read-${c.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Read
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-400" /> Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
