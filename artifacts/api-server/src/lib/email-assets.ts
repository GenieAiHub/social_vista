import { db, emailAssetsTable } from "@workspace/db";
import { and, eq, isNull, lt } from "drizzle-orm";
import { logger } from "./logger.js";

/**
 * How long an uploaded-but-never-sent email image is kept before it becomes
 * eligible for pruning. Images that have actually been sent (usedAt set) are
 * never pruned, because recipients' email clients fetch them by URL long after
 * delivery.
 */
export const EMAIL_ASSET_RETENTION_DAYS = 7;

/** How often the background cleanup sweep runs. */
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

/** Extracts the numeric asset id from a `/api/email-assets/:id` URL (or null). */
export function parseEmailAssetId(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = url.match(/\/email-assets\/(\d+)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Marks the asset referenced by `url` as used (sent), so it is retained
 * indefinitely and excluded from pruning. No-op for URLs that don't point at a
 * stored email asset (e.g. external image URLs). Best-effort: never throws.
 */
export async function markEmailAssetUsedByUrl(url: string | null | undefined): Promise<void> {
  const id = parseEmailAssetId(url);
  if (id == null) return;
  try {
    await db
      .update(emailAssetsTable)
      .set({ usedAt: new Date() })
      .where(and(eq(emailAssetsTable.id, id), isNull(emailAssetsTable.usedAt)));
  } catch (err) {
    logger.error({ err, assetId: id }, "Failed to mark email asset as used");
  }
}

/**
 * Deletes never-sent email assets older than the retention window. Returns the
 * number of rows removed. Safe to call repeatedly.
 */
export async function pruneUnusedEmailAssets(): Promise<number> {
  const cutoff = new Date(Date.now() - EMAIL_ASSET_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(emailAssetsTable)
    .where(and(isNull(emailAssetsTable.usedAt), lt(emailAssetsTable.createdAt, cutoff)))
    .returning({ id: emailAssetsTable.id });
  return deleted.length;
}

/**
 * Starts the recurring cleanup sweep that prunes orphaned (uploaded but never
 * sent) email images. Runs once shortly after startup, then on a fixed
 * interval. The interval is unref'd so it never keeps the process alive.
 */
export function startEmailAssetCleanup(): void {
  const run = async () => {
    try {
      const removed = await pruneUnusedEmailAssets();
      if (removed > 0) {
        logger.info({ removed, retentionDays: EMAIL_ASSET_RETENTION_DAYS }, "Pruned unused email assets");
      }
    } catch (err) {
      logger.error({ err }, "Failed to prune unused email assets");
    }
  };
  // Defer the first run a little so it doesn't compete with startup work.
  setTimeout(run, 30 * 1000).unref();
  setInterval(run, CLEANUP_INTERVAL_MS).unref();
}
