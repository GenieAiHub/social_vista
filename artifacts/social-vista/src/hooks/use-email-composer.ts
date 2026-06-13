import { useCallback, useState } from "react";
import { useUploadEmailAsset } from "@workspace/api-client-react";
import {
  getPreset,
  renderPreview,
  type ImagePlacement,
  type LeadTemplateId,
} from "@/lib/email-templates";

export interface ReplyPayload {
  subject: string;
  message: string;
  templateId: LeadTemplateId;
  imageUrl: string | null;
  imagePlacement: ImagePlacement;
}

export interface EmailComposer {
  templateId: LeadTemplateId;
  subject: string;
  message: string;
  imageUrl: string | null;
  imagePlacement: ImagePlacement;
  uploading: boolean;
  isValid: boolean;
  setSubject: (v: string) => void;
  setMessage: (v: string) => void;
  setImagePlacement: (v: ImagePlacement) => void;
  applyTemplate: (id: LeadTemplateId) => void;
  uploadFile: (file: File) => Promise<void>;
  removeImage: () => void;
  previewHtml: (name: string) => string;
  payload: () => ReplyPayload;
  reset: (id?: LeadTemplateId) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Shared state + behaviour for composing a branded lead email. Used by both the
 * per-lead reply dialog and the standalone Email Composer page so the editor is
 * identical in both places.
 */
export function useEmailComposer(initial: LeadTemplateId = "intro"): EmailComposer {
  const upload = useUploadEmailAsset();
  const [templateId, setTemplateId] = useState<LeadTemplateId>(initial);
  const [subject, setSubject] = useState(getPreset(initial).subject);
  const [message, setMessage] = useState(getPreset(initial).body);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePlacement, setImagePlacement] = useState<ImagePlacement>("banner");

  const applyTemplate = useCallback((id: LeadTemplateId) => {
    const preset = getPreset(id);
    setTemplateId(id);
    setSubject(preset.subject);
    setMessage(preset.body);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const dataBase64 = await fileToBase64(file);
      const asset = await upload.mutateAsync({
        data: { filename: file.name, mimeType: file.type, dataBase64 },
      });
      setImageUrl(asset.url);
    },
    [upload],
  );

  const removeImage = useCallback(() => setImageUrl(null), []);

  const previewHtml = useCallback(
    (name: string) => renderPreview(templateId, { name, message, imageUrl, imagePlacement }),
    [templateId, message, imageUrl, imagePlacement],
  );

  const payload = useCallback(
    (): ReplyPayload => ({ subject, message, templateId, imageUrl, imagePlacement }),
    [subject, message, templateId, imageUrl, imagePlacement],
  );

  const reset = useCallback(
    (id: LeadTemplateId = "intro") => {
      const preset = getPreset(id);
      setTemplateId(id);
      setSubject(preset.subject);
      setMessage(preset.body);
      setImageUrl(null);
      setImagePlacement("banner");
    },
    [],
  );

  return {
    templateId,
    subject,
    message,
    imageUrl,
    imagePlacement,
    uploading: upload.isPending,
    isValid: subject.trim().length > 0 && message.trim().length > 0,
    setSubject,
    setMessage,
    setImagePlacement,
    applyTemplate,
    uploadFile,
    removeImage,
    previewHtml,
    payload,
    reset,
  };
}
