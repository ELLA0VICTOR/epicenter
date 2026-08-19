import { performance } from "node:perf_hooks";

import { Router } from "express";

import { parsePackageLock } from "../ingestion/lockfileParser.js";
import { analyzeBlastRadius } from "../services/blastRadiusService.js";
import { ingestParsedLockfile } from "../services/lockfileIngestionService.js";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (request, response) => {
  const totalStarted = performance.now();
  const lockfile = request.body?.lockfile;
  const requestedSourceLabel = request.body?.sourceLabel;

  if (typeof lockfile !== "string" || lockfile.trim().length === 0) {
    response.status(400).json({ error: "lockfile must be a non-empty string" });
    return;
  }
  if (
    requestedSourceLabel !== undefined &&
    (typeof requestedSourceLabel !== "string" ||
      requestedSourceLabel.trim().length === 0 ||
      requestedSourceLabel.length > 120)
  ) {
    response.status(400).json({
      error: "sourceLabel must be a non-empty string of at most 120 characters",
    });
    return;
  }

  const sourceLabel = requestedSourceLabel?.trim() || "Uploaded package-lock.json";

  try {
    const parseStarted = performance.now();
    const parsed = parsePackageLock(lockfile);
    const parseMs = performance.now() - parseStarted;

    const ingestionStarted = performance.now();
    const ingestion = await ingestParsedLockfile(lockfile, parsed, sourceLabel);
    const ingestionMs = performance.now() - ingestionStarted;
    const blastRadius = await analyzeBlastRadius(parsed);

    response.json({
      submission: {
        id: ingestion.submissionId,
        sourceLabel,
        lockfileVersion: parsed.lockfileVersion,
        rootName: parsed.rootName,
        rootVersion: parsed.rootVersion,
        packageCount: ingestion.packageCount,
        dependencyEdgeCount: ingestion.dependencyEdgeCount,
        unresolvedDependencyCount: ingestion.unresolvedDependencyCount,
      },
      exposure: {
        exposed: blastRadius.exposed,
        directCount: blastRadius.directExposureCount,
        transitiveCount: blastRadius.transitiveExposureCount,
        totalCount: blastRadius.exposures.length,
      },
      exposures: blastRadius.exposures,
      graph: blastRadius.graph,
      traversal: blastRadius.traversal,
      timing: {
        parseMs: Number(parseMs.toFixed(2)),
        ingestionMs: Number(ingestionMs.toFixed(2)),
        ...blastRadius.timing,
        totalMs: Number((performance.now() - totalStarted).toFixed(2)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isLockfileError =
      message.startsWith("Invalid package-lock.json") ||
      message.startsWith("Unsupported package-lock");
    response.status(isLockfileError ? 400 : 502).json({ error: message });
  }
});
