import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Image uploads (base64 JSON) need a larger body than the default 100kb. Mount a
// higher-limit parser scoped to the upload route BEFORE the global parser; once
// body-parser parses a request it sets req._body, so the global json() below
// skips it. All other routes keep the conservative default limit.
app.use("/api/admin/email-assets", express.json({ limit: "8mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built React SPA for all non-API routes when a build is present.
// Detect by file existence so this works regardless of NODE_ENV at runtime.
const staticDir = path.resolve(__dirname, "../../social-vista/dist/public");
const indexHtml = path.join(staticDir, "index.html");
if (fs.existsSync(indexHtml)) {
  app.use(express.static(staticDir));
  // Express 5 no longer accepts a bare "*"; use a named splat wildcard.
  app.get("/*splat", (_req, res) => {
    res.sendFile(indexHtml);
  });
}

export default app;
