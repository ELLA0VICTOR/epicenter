import { Router } from "express";

import { runQuery, type HydraQueryValue } from "../hydra/client.js";
import {
  INCIDENT_REPLAY_EXISTS_QUERY,
  INCIDENT_REPLAY_QUERY,
} from "../hydra/cypher/incidentReplay.js";

const text = (value: HydraQueryValue | undefined): string | null =>
  typeof value?.value === "string" ? value.value : null;

export const incidentReplayRouter = Router();

incidentReplayRouter.get("/incidents/:id/replay", async (request, response) => {
  const incidentId = request.params.id?.trim() ?? "";
  if (!incidentId || incidentId.length > 160) {
    response.status(400).json({ error: "A valid incident id is required" });
    return;
  }

  try {
    const [incidentResult, replayResult] = await Promise.all([
      runQuery(
        INCIDENT_REPLAY_EXISTS_QUERY,
        { incidentId },
        { consistency: "strong" },
      ),
      runQuery(
        INCIDENT_REPLAY_QUERY,
        { incidentId },
        { consistency: "strong" },
      ),
    ]);

    if (incidentResult.rows.length === 0) {
      response.status(404).json({ error: `Unknown incident: ${incidentId}` });
      return;
    }

    const versions = replayResult.rows.flatMap((row) => {
      const nodeId = text(row[0]);
      const packageName = text(row[1]);
      const version = text(row[2]);
      const publishedAt = text(row[3]);
      const publishedAtMs = publishedAt ? Date.parse(publishedAt) : Number.NaN;

      return nodeId && packageName && version && publishedAt && Number.isFinite(publishedAtMs)
        ? [{ nodeId, packageName, version, publishedAt, publishedAtMs }]
        : [];
    });
    const firstPublishedAtMs = versions[0]?.publishedAtMs ?? 0;

    response.json(
      versions.map(({ publishedAtMs, ...version }) => ({
        timestampOffsetSeconds: Math.max(
          0,
          Math.round((publishedAtMs - firstPublishedAtMs) / 1_000),
        ),
        ...version,
        event: "compromised" as const,
      })),
    );
  } catch (error) {
    response.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to load incident replay",
    });
  }
});
