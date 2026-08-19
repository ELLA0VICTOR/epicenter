import { Router } from "express";

import { runQuery, type HydraQueryValue } from "../hydra/client.js";
import {
  INCIDENT_COMPROMISED_PACKAGES_QUERY,
  MAINTAINER_OVERLAP_QUERY,
} from "../hydra/cypher/maintainerOverlap.js";

const text = (value: HydraQueryValue | undefined): string | null =>
  typeof value?.value === "string" ? value.value : null;

export const maintainerOverlapRouter = Router();

maintainerOverlapRouter.get("/maintainer-overlap", async (request, response) => {
  const incidentId =
    typeof request.query.incidentId === "string"
      ? request.query.incidentId.trim()
      : "";
  if (!incidentId) {
    response.status(400).json({ error: "incidentId is required" });
    return;
  }

  try {
    const [incidentResult, overlapResult] = await Promise.all([
      runQuery(
        INCIDENT_COMPROMISED_PACKAGES_QUERY,
        { incidentId },
        { consistency: "strong" },
      ),
      runQuery(
        MAINTAINER_OVERLAP_QUERY,
        { incidentId },
        { consistency: "strong" },
      ),
    ]);

    const incidentName = text(incidentResult.rows[0]?.[1]);
    if (!incidentName) {
      response.status(404).json({ error: `Unknown incident: ${incidentId}` });
      return;
    }

    const compromisedPackageNames = Array.from(
      new Set(incidentResult.rows.map((row) => text(row[2])).filter(Boolean)),
    ) as string[];
    const compromisedSet = new Set(compromisedPackageNames);
    const overlaps = new Map<string, Set<string>>();

    for (const row of overlapResult.rows) {
      const maintainer = text(row[0]);
      const otherPackage = text(row[2]);
      if (!maintainer || !otherPackage || compromisedSet.has(otherPackage)) {
        continue;
      }
      const packages = overlaps.get(maintainer) ?? new Set<string>();
      packages.add(otherPackage);
      overlaps.set(maintainer, packages);
    }

    const result = Array.from(overlaps, ([maintainer, packages]) => ({
      maintainer,
      otherPackages: Array.from(packages).sort(),
    })).sort((left, right) => left.maintainer.localeCompare(right.maintainer));

    response.json({
      incident: { id: incidentId, name: incidentName },
      compromisedPackageNames,
      overlaps: result,
      summary: {
        compromisedPackageCount: compromisedPackageNames.length,
        maintainerCount: result.length,
        overlapPackageCount: new Set(
          result.flatMap((entry) => entry.otherPackages),
        ).size,
      },
    });
  } catch (error) {
    response.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to load maintainer overlap",
    });
  }
});
