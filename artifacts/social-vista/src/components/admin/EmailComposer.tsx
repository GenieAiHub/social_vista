import { useState, useMemo } from "react";
import { Send } from "lucide-react";
import { useReplyToLead, type Lead } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  TEMPLATE_PRESETS,
  getPreset,
  renderPreview,
  type LeadTemplateId,
} from "@/lib/email-templates";

export default function EmailComposer({ lead, onReplied }: { lead: Lead; onReplied: () => void }) {
  const replyToLead = useReplyToLead();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<LeadTemplateId>("intro");
  const [subject, setSubject] = useState(getPreset("intro").subject);
  const [message, setMessage] = useState(getPreset("intro").body);

  function applyTemplate(id: LeadTemplateId) {
    const preset = getPreset(id);
    setTemplateId(id);
    setSubject(preset.subject);
    setMessage(preset.body);
  }

  const previewHtml = useMemo(
    () => renderPreview(templateId, { name: lead.name, message }),
    [templateId, lead.name, message],
  );

  function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Subject and message are required.", variant: "destructive" });
      return;
    }
    replyToLead.mutate(
      { id: lead.id, data: { subject, message, templateId } },
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
        if (o) applyTemplate(templateId);
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Email {lead.name}</DialogTitle>
          <DialogDescription>
            Sends to {lead.email} and marks this lead as contacted. Pick a template, tweak the
            wording, and preview before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label>Template</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {TEMPLATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyTemplate(preset.id)}
                    className={`text-left rounded-lg border p-2.5 transition-colors ${
                      templateId === preset.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-template-${preset.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ background: preset.theme.headerBg }}
                      />
                      <span className="text-xs font-medium text-foreground">{preset.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor={`composer-subject-${lead.id}`}>Subject</Label>
              <Input
                id={`composer-subject-${lead.id}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
                data-testid={`input-reply-subject-${lead.id}`}
              />
            </div>
            <div>
              <Label htmlFor={`composer-message-${lead.id}`}>Message</Label>
              <Textarea
                id={`composer-message-${lead.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 min-h-[200px]"
                data-testid={`textarea-reply-message-${lead.id}`}
              />
            </div>
          </div>

          <div>
            <Label>Preview</Label>
            <div className="mt-1 rounded-lg border border-border overflow-hidden bg-muted/20">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="w-full h-[420px] bg-white"
                sandbox=""
                data-testid={`iframe-email-preview-${lead.id}`}
              />
            </div>
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
