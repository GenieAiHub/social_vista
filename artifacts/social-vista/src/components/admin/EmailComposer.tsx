import { useState } from "react";
import { Send } from "lucide-react";
import { useReplyToLead, type Lead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEmailComposer } from "@/hooks/use-email-composer";
import EmailComposerFields from "@/components/admin/EmailComposerFields";

export default function EmailComposer({ lead, onReplied }: { lead: Lead; onReplied: () => void }) {
  const replyToLead = useReplyToLead();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const composer = useEmailComposer("intro");

  function handleSend() {
    if (!composer.isValid) {
      toast({ title: "Subject and message are required.", variant: "destructive" });
      return;
    }
    const { subject, message, templateId, imageUrl, imagePlacement } = composer.payload();
    replyToLead.mutate(
      { id: lead.id, data: { subject, message, templateId, imageUrl, imagePlacement } },
      {
        onSuccess: () => {
          toast({ title: `Reply sent to ${lead.name}.` });
          setOpen(false);
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) composer.reset("intro");
      }}
    >
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email {lead.name}</DialogTitle>
          <DialogDescription>
            Sends to {lead.email} and marks this lead as contacted. Pick a template, tweak the
            wording, add an image, and preview before sending.
          </DialogDescription>
        </DialogHeader>

        <EmailComposerFields
          composer={composer}
          previewName={lead.name}
          idPrefix={`composer-${lead.id}`}
        />

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
