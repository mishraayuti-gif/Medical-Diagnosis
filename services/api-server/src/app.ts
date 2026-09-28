import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve static dark showcase portal
let staticPortalDir: string | null = null;
const staticPortalCandidates = [
  path.resolve(__dirname, "../../../apps/static-portal"),
  path.resolve(process.cwd(), "../../apps/static-portal"),
  path.resolve(process.cwd(), "apps/static-portal"),
  path.resolve(process.cwd(), "../static-portal"),
];

for (const candidate of staticPortalCandidates) {
  if (fs.existsSync(candidate)) {
    staticPortalDir = candidate;
    app.use("/portal", express.static(candidate));
    app.use(express.static(candidate));
    break;
  }
}

if (staticPortalDir) {
  app.get("/", (_req, res) => {
    res.sendFile(path.join(staticPortalDir!, "index.html"));
  });
}

// Serve local peace audio tracks
const audioCandidates = [
  path.resolve(__dirname, "../public/audio"),
  path.resolve(__dirname, "../../public/audio"),
  path.resolve(process.cwd(), "public/audio"),
  path.resolve(process.cwd(), "services/api-server/public/audio"),
  path.resolve(process.cwd(), "apps/medigrid-app/public/audio"),
];

for (const candidate of audioCandidates) {
  if (fs.existsSync(candidate)) {
    app.use("/audio", express.static(candidate));
    app.use("/api/audio/files", express.static(candidate));
    break;
  }
}

export default app;
