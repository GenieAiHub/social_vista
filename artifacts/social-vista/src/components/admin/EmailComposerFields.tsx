import { useRef, useState } from "react";
import { ImagePlus, Images, Loader2, Trash2, X } from "lucide-react";
import {
  useListEmailAssets,
  useDeleteEmailAsset,
  getListEmailAssetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATE_PRESETS } from "@/lib/email-templates";
import type { EmailComposer } from "@/hooks/use-email-composer";

const ACCEPTED = "image/png,image/jpeg,image/gif,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export default function EmailComposerFields({
  composer,
  previewName,
  idPrefix,
  previewHeight = "420px",
}: {
  composer: EmailComposer;
  previewName: string;
  idPrefix: string;
  previewHeight?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const { data: recentImages, isLoading: loadingLibrary } = useListEmailAssets({
    query: { enabled: showLibrary, queryKey: getListEmailAssetsQueryKey() },
  });
  const deleteAsset = useDeleteEmailAsset();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleDelete(e: React.MouseEvent, id: number, url: string) {
    e.stopPropagation();
    setDeletingId(id);
    deleteAsset.mutate(
      { id },
      {
        onSuccess: () => {
          if (composer.imageUrl === url) composer.removeImage();
          queryClient.invalidateQueries({ queryKey: getListEmailAssetsQueryKey() });
          toast({ title: "Image deleted." });
        },
        onError: () =>
          toast({
            title: "Could not delete the image. It may have already been sent.",
            variant: "destructive",
          }),
        onSettled: () => setDeletingId(null),
      },
    );
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.split(",").includes(file.type)) {
      toast({ title: "Unsupported file. Use PNG, JPEG, GIF, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image is too large. Maximum size is 5MB.", variant: "destructive" });
      return;
    }
    try {
      await composer.uploadFile(file);
      toast({ title: "Image added to the email." });
    } catch {
      toast({ title: "Could not upload the image. Please try again.", variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div>
          <Label>Template</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => composer.applyTemplate(preset.id)}
                className={`text-left rounded-lg border p-2.5 transition-colors ${
                  composer.templateId === preset.id
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
          <Label htmlFor={`${idPrefix}-subject`}>Subject</Label>
          <Input
            id={`${idPrefix}-subject`}
            value={composer.subject}
            onChange={(e) => composer.setSubject(e.target.value)}
            className="mt-1"
            data-testid="input-reply-subject"
          />
        </div>

        <div>
          <Label htmlFor={`${idPrefix}-message`}>Message</Label>
          <Textarea
            id={`${idPrefix}-message`}
            value={composer.message}
            onChange={(e) => composer.setMessage(e.target.value)}
            className="mt-1 min-h-[180px]"
            data-testid="textarea-reply-message"
          />
        </div>

        <div>
          <Label>Image</Label>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFile}
            data-testid="input-reply-image"
          />
          {composer.imageUrl ? (
            <div className="mt-1.5 space-y-2">
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/20">
                <img
                  src={composer.imageUrl}
                  alt="Selected"
                  className="w-full max-h-40 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={composer.removeImage}
                  className="absolute top-1.5 right-1.5 rounded-full bg-background/90 border border-border p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  aria-label="Remove image"
                  data-testid="button-remove-image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Placement</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["banner", "inline"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => composer.setImagePlacement(p)}
                      className={`rounded-lg border p-2 text-xs font-medium capitalize transition-colors ${
                        composer.imagePlacement === p
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                      data-testid={`button-placement-${p}`}
                    >
                      {p === "banner" ? "Banner (top)" : "Inline (in body)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={composer.uploading}
                  data-testid="button-upload-image"
                >
                  {composer.uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4 mr-2" />
                  )}
                  {composer.uploading ? "Uploading…" : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant={showLibrary ? "default" : "outline"}
                  onClick={() => setShowLibrary((v) => !v)}
                  data-testid="button-toggle-image-library"
                >
                  <Images className="w-4 h-4 mr-2" />
                  Recent images
                </Button>
              </div>
              {showLibrary && (
                <div
                  className="rounded-lg border border-border p-2 bg-muted/20"
                  data-testid="image-library"
                >
                  {loadingLibrary ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : recentImages && recentImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {recentImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative group rounded-md border border-border overflow-hidden bg-white aspect-square"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              composer.selectImage(img.url);
                              setShowLibrary(false);
                              toast({ title: "Image added to the email." });
                            }}
                            className="w-full h-full hover:opacity-90 transition-opacity"
                            title={img.filename ?? "Email image"}
                            data-testid={`button-library-image-${img.id}`}
                          >
                            <img
                              src={img.url}
                              alt={img.filename ?? "Email image"}
                              className="w-full h-full object-contain"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, img.id, img.url)}
                            disabled={deletingId === img.id}
                            className="absolute top-1 right-1 rounded-full bg-background/90 border border-border p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-100"
                            aria-label="Delete image"
                            title="Delete image"
                            data-testid={`button-delete-image-${img.id}`}
                          >
                            {deletingId === img.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No images uploaded yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">
            PNG, JPEG, GIF, or WebP up to 5MB.
          </p>
        </div>
      </div>

      <div>
        <Label>Preview</Label>
        <div className="mt-1 rounded-lg border border-border overflow-hidden bg-muted/20">
          <iframe
            title="Email preview"
            srcDoc={composer.previewHtml(previewName)}
            className="w-full bg-white"
            style={{ height: previewHeight }}
            sandbox=""
            data-testid="iframe-email-preview"
          />
        </div>
      </div>
    </div>
  );
}
