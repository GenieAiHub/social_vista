import { useMemo, useState } from "react";
import { Mail, Send, ShieldAlert } from "lucide-react";
import {
  useListLeads,
  useReplyToLead,
  getListLeadsQueryKey,
  type Lead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import EmailComposerFields from "@/components/admin/EmailComposerFields";
import { useEmailComposer } from "@/hooks/use-email-composer";
import { hasPermission } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function EmailComposerPage() {
  const canEmail = hasPermission("canEmailLeads");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const replyToLead = useReplyToLead();
  const composer = useEmailComposer("intro");
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: leads = [], isLoading } = useListLeads(undefined, {
    query: { enabled: canEmail, queryKey: getListLeadsQueryKey() },
  });

  const emailable = useMemo(
    () => leads.filter((l): l is Lead => Boolean(l.email)),
    [leads],
  );
  const selected = emailable.find((l) => String(l.id) === selectedId) ?? null;

  function handleSend() {
    if (!selected) {
      toast({ title: "Pick a recipient first.", variant: "destructive" });
      return;
    }
    if (!composer.isValid) {
      toast({ title: "Subject and message are required.", variant: "destructive" });
      return;
    }
    const { subject, message, templateId, imageUrl, imagePlacement } = composer.payload();
    replyToLead.mutate(
      { id: selected.id, data: { subject, message, templateId, imageUrl, imagePlacement } },
      {
        onSuccess: () => {
          toast({ title: `Email sent to ${selected.name}.` });
          queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
          composer.reset("intro");
          setSelectedId("");
        },
        onError: () =>
          toast({
            title: "Could not send the email. Check the email configuration.",
            variant: "destructive",
          }),
      },
    );
  }

  if (!canEmail) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-16 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold text-foreground">No access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have permission to email leads. Ask an owner to grant it.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Email Composer</h1>
            <p className="text-sm text-muted-foreground">
              Compose a branded email, add an image, and send it to any lead.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="max-w-sm">
            <Label htmlFor="composer-recipient">Recipient</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger
                id="composer-recipient"
                className="mt-1"
                data-testid="select-recipient"
              >
                <SelectValue
                  placeholder={isLoading ? "Loading leads…" : "Select a lead…"}
                />
              </SelectTrigger>
              <SelectContent>
                {emailable.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No leads with an email address
                  </SelectItem>
                ) : (
                  emailable.map((lead) => (
                    <SelectItem key={lead.id} value={String(lead.id)}>
                      {lead.name} — {lead.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Sending to {selected.email}. This marks new leads as contacted.
              </p>
            )}
          </div>

          <EmailComposerFields
            composer={composer}
            previewName={selected?.name ?? "there"}
            idPrefix="page-composer"
            previewHeight="520px"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={replyToLead.isPending || !selected}
              data-testid="button-send-email"
            >
              <Send className="w-4 h-4 mr-2" />
              {replyToLead.isPending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
