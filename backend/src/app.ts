import express from "express";

import { analyzeRouter } from "./routes/analyze.js";
import { healthRouter } from "./routes/health.js";
import { incidentReplayRouter } from "./routes/incidentReplay.js";
import { incidentsRouter } from "./routes/incidents.js";
import { maintainerOverlapRouter } from "./routes/maintainerOverlap.js";
import { typosquatsRouter } from "./routes/typosquats.js";

export const app = express();

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
