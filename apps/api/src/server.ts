import "./types";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import client from "prom-client";
import swaggerUi from "swagger-ui-express";
import crypto from "node:crypto";
import { env } from "./config";
import { connectDatabase, isDatabaseReady } from "./db";
import { getRedis } from "./queues";
import { csrfProtection } from "./auth";
import { errorHandler, notFound } from "./errors";
import { openApiDocument } from "./openapi";
import { router } from "./routes";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info", redact: ["req.headers.cookie", "req.body.password", "req.body.token"] });
const requestCounter = new client.Counter({ name: "credora_http_requests_total", help: "HTTP requests", labelNames: ["method", "route", "status"] });
const requestDuration = new client.Histogram({ name: "credora_http_request_duration_seconds", help: "HTTP request duration", labelNames: ["method", "route", "status"] });
client.collectDefaultMetrics();

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use((req, res, next) => { req.requestId = req.get("x-request-id") || crypto.randomUUID(); res.setHeader("x-request-id", req.requestId); next(); });
  app.use(pinoHttp({ logger, genReqId: (req) => (req as express.Request).requestId, customProps: (req) => ({ requestId: (req as express.Request).requestId }) }));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.ENABLE_CROSS_SITE_CREDENTIALS ? env.WEB_ORIGIN : false, credentials: env.ENABLE_CROSS_SITE_CREDENTIALS }));
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());
  app.use((req, res, next) => { const start = process.hrtime.bigint(); res.on("finish", () => { const seconds = Number(process.hrtime.bigint() - start) / 1e9; const route = req.route?.path ?? req.path; requestCounter.inc({ method: req.method, route, status: res.statusCode }); requestDuration.observe({ method: req.method, route, status: res.statusCode }, seconds); }); next(); });
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/ready", async (_req, res) => { const mongo = await isDatabaseReady(); let redis = false; try { redis = (await getRedis().ping()) === "PONG"; } catch { redis = false; } res.status(mongo && redis ? 200 : 503).json({ status: mongo && redis ? "ready" : "degraded", mongo, redis }); });
  app.get("/metrics", async (_req, res) => { res.setHeader("content-type", client.register.contentType); res.end(await client.register.metrics()); });
  app.get("/api/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
  app.use(csrfProtection);
  app.use(router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function start() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.PORT, "0.0.0.0", () => logger.info({ port: env.PORT }, "Credora API listening"));
}

if (process.env.NODE_ENV !== "test") start().catch((error) => { logger.fatal({ err: error }, "Unable to start API"); process.exit(1); });
