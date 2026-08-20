import express from "express";

import { env } from "./config/env.js";
import { analyzeRouter } from "./routes/analyze.js";
import { healthRouter } from "./routes/health.js";
import { incidentReplayRouter } from "./routes/incidentReplay.js";
import { incidentsRouter } from "./routes/incidents.js";
import { maintainerOverlapRouter } from "./routes/maintainerOverlap.js";
import { typosquatsRouter } from "./routes/typosquats.js";

export const app = express();

app.use((request, response, next) => {
  const requestOrigin = request.headers.origin;
  const originAllowed =
    env.frontendOrigin === "*" ||
    !requestOrigin ||
    requestOrigin === env.frontendOrigin;

  if (originAllowed) {
    response.setHeader(
      "Access-Control-Allow-Origin",
      env.frontendOrigin === "*" ? "*" : env.frontendOrigin,
    );
  }
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    response.sendStatus(originAllowed ? 204 : 403);
    return;
  }

  next();
});

app.use(express.json({ limit: "12mb" }));
app.use(
  "/api",
  healthRouter,
  incidentsRouter,
  incidentReplayRouter,
  maintainerOverlapRouter,
  typosquatsRouter,
  analyzeRouter,
);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({ error: "Request body must be valid JSON" });
      return;
    }
    response.status(500).json({ error: "Unexpected server error" });
  },
);
