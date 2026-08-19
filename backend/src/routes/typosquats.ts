import { Router } from "express";

import { runQuery, type HydraQueryValue } from "../hydra/client.js";
import { TYPOSQUAT_MATCHES_QUERY } from "../hydra/cypher/typosquats.js";

const PACKAGE_EXISTS_QUERY = `
MATCH (package:Package {name: $packageName, campaign: true})
RETURN package.name AS name
`;

const scalar = (value: HydraQueryValue | undefined): string | number | null => {
  const result = value?.value;
  return typeof result === "string" || typeof result === "number"
    ? result
    : null;
};

export const typosquatsRouter = Router();

typosquatsRouter.get("/typosquats", async (request, response) => {
  const packageName =
    typeof request.query.packageName === "string"
      ? request.query.packageName.trim()
      : "";
  if (!packageName) {
    response.status(400).json({ error: "packageName is required" });
    return;
  }
  if (packageName.length > 214) {
    response.status(400).json({ error: "packageName is too long" });
    return;
  }

  try {
    const [existsResult, matchResult] = await Promise.all([
      runQuery(
        PACKAGE_EXISTS_QUERY,
        { packageName },
        { consistency: "strong" },
      ),
      runQuery(
        TYPOSQUAT_MATCHES_QUERY,
        { packageName },
        { consistency: "strong" },
      ),
    ]);
    if (existsResult.rows.length === 0) {
      response.status(404).json({
        error: `Package is not in the seeded campaign set: ${packageName}`,
      });
      return;
    }

    const matches = matchResult.rows.flatMap((row) => {
      const name = scalar(row[1]);
      const ecosystem = scalar(row[2]);
      const distance = scalar(row[3]);
      const source = scalar(row[4]);
      return typeof name === "string" &&
        typeof ecosystem === "string" &&
        typeof distance === "number" &&
        typeof source === "string"
        ? [{ name, ecosystem, distance, source }]
        : [];
    });

    response.json({
      packageName,
      matches,
      summary: { matchCount: matches.length, maximumDistance: 2 },
      corpus: {
        name: "npm-high-impact@1.13.0",
        packageCount: 2_000,
        sourceUrl: "https://github.com/wooorm/npm-high-impact",
      },
    });
  } catch (error) {
    response.status(502).json({
      error:
        error instanceof Error ? error.message : "Unable to load typosquats",
    });
  }
});
