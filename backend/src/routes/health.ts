import { Router } from "express";

import { runQuery } from "../hydra/client.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_request, response) => {
  try {
    const hydra = await runQuery(
      "MATCH (n:Incident) RETURN count(*) AS incident_count",
    );
    response.json({ ok: true, hydra: "ready", queryId: hydra.query_id });
  } catch (error) {
    response.status(503).json({
      ok: false,
      hydra: "unavailable",
      error: error instanceof Error ? error.message : "Unknown HydraDB error",
    });
  }
});
