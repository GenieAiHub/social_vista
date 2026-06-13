import { Router } from "express";
import { db, emailAssetsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { UploadEmailAssetBody } from "@workspace/api-zod";
import { requireAuth, requirePermission, type AuthedRequest } from "../lib/auth.js";

const router = Router();

const LIST_LIMIT = 60;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB decoded

router.post(
  "/admin/email-assets",
  requireAuth,
  requirePermission("canEmailLeads"),
  async (req, res) => {
    try {
      const author = (req as AuthedRequest).staff;
      const body = UploadEmailAssetBody.parse(req.body);
      if (!ALLOWED_MIME.has(body.mimeType)) {
        res.status(400).json({ error: "Unsupported image type. Use PNG, JPEG, GIF, or WebP." });
        return;
      }
      const buffer = Buffer.from(body.dataBase64, "base64");
      if (buffer.length === 0) {
        res.status(400).json({ error: "The image data is empty or invalid." });
        return;
      }
      if (buffer.length > MAX_BYTES) {
        res.status(400).json({ error: "Image is too large. Maximum size is 5MB." });
        return;
      }
      const [asset] = await db
        .insert(emailAssetsTable)
        .values({
          data: buffer.toString("base64"),
          mimeType: body.mimeType,
          filename: body.filename ?? null,
          createdBy: author?.id ?? null,
        })
        .returning();
      res.status(201).json({
        id: asset.id,
        url: `/api/email-assets/${asset.id}`,
        mimeType: asset.mimeType,
        filename: asset.filename,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to upload email asset");
      res.status(400).json({ error: "Invalid input" });
    }
  },
);

router.get(
  "/admin/email-assets",
  requireAuth,
  requirePermission("canEmailLeads"),
  async (req, res) => {
    try {
      const assets = await db
        .select({
          id: emailAssetsTable.id,
          mimeType: emailAssetsTable.mimeType,
          filename: emailAssetsTable.filename,
        })
        .from(emailAssetsTable)
        .orderBy(desc(emailAssetsTable.createdAt))
        .limit(LIST_LIMIT);
      res.json(
        assets.map((asset) => ({
          id: asset.id,
          url: `/api/email-assets/${asset.id}`,
          mimeType: asset.mimeType,
          filename: asset.filename,
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to list email assets");
      res.status(500).json({ error: "Failed to load images" });
    }
  },
);

// Public: email clients fetch images by URL, so this must be unauthenticated.
router.get("/email-assets/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).end();
      return;
    }
    const [asset] = await db
      .select()
      .from(emailAssetsTable)
      .where(eq(emailAssetsTable.id, id));
    if (!asset) {
      res.status(404).end();
      return;
    }
    const buffer = Buffer.from(asset.data, "base64");
    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Failed to serve email asset");
    res.status(500).end();
  }
});

export default router;
