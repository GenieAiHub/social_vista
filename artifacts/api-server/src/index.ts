import app from "./app";
import { logger } from "./lib/logger";
import { seedOwner } from "./lib/auth";
import { startEmailAssetCleanup } from "./lib/email-assets";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await seedOwner();
  } catch (seedErr) {
    logger.error({ err: seedErr }, "Failed to seed owner account");
  }

  startEmailAssetCleanup();
});
