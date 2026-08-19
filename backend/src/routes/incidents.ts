import { Router } from "express";

import { runQuery, type HydraQueryValue } from "../hydra/client.js";

const INCIDENTS_QUERY = `
MATCH (incident:Incident)
RETURN incident.incident_id AS id,
       incident.name AS name,
       incident.disclosed_at AS disclosed_at,
       incident.description AS description,
       incident.source_url AS source_url
ORDER BY incident.disclosed_at
`;

const INCIDENT_COUNTS_QUERY = `
MATCH (version:PackageVersion)-[:COMPROMISED_IN]->(incident:Incident)
RETURN incident.incident_id AS id
`;

const scalar = (value: HydraQueryValue | undefined): string | number | null => {
  const scalarValue = value?.value;
  return typeof scalarValue === "string" || typeof scalarValue === "number"
    ? scalarValue
    : null;
};

const countQuery = async (query: string): Promise<number> => {
  const response = await runQuery(query, {}, { consistency: "strong" });
  const count = scalar(response.rows[0]?.[0]);
  return typeof count === "number" ? count : 0;
};

export const incidentsRouter = Router();

incidentsRouter.get("/incidents", async (_request, response) => {
  try {
    const [incidentsResult, incidentCountsResult, packageCount, versionCount, incidentCount, maintainerCount] =
      await Promise.all([
        runQuery(INCIDENTS_QUERY, {}, { consistency: "strong" }),
        runQuery(INCIDENT_COUNTS_QUERY, {}, { consistency: "strong" }),
        countQuery("MATCH (node:Package {campaign: true}) RETURN count(*) AS total"),
        countQuery(
          "MATCH (node:PackageVersion {compromised: true}) RETURN count(*) AS total",
        ),
        countQuery("MATCH (node:Incident) RETURN count(*) AS total"),
        countQuery("MATCH (node:Maintainer) RETURN count(*) AS total"),
      ]);

    const compromisedCounts = new Map<string, number>();
    for (const row of incidentCountsResult.rows) {
      const id = scalar(row[0]);
      if (typeof id === "string") {
        compromisedCounts.set(id, (compromisedCounts.get(id) ?? 0) + 1);
      }
    }

    const incidents = incidentsResult.rows.flatMap((row) => {
      const id = scalar(row[0]);
      const name = scalar(row[1]);
      const disclosedAt = scalar(row[2]);
      const description = scalar(row[3]);
      const sourceUrl = scalar(row[4]);
      return [id, name, disclosedAt, description, sourceUrl].every(
        (value) => typeof value === "string",
      )
        ? [
            {
              id: id as string,
              name: name as string,
              disclosedAt: disclosedAt as string,
              description: description as string,
              sourceUrl: sourceUrl as string,
              compromisedVersionCount: compromisedCounts.get(id as string) ?? 0,
            },
          ]
        : [];
    });

    response.json({
      incidents,
      summary: {
        packageCount,
        compromisedVersionCount: versionCount,
        incidentCount,
        maintainerCount,
      },
    });
  } catch (error) {
    response.status(502).json({
      error: error instanceof Error ? error.message : "Unable to load incidents",
    });
  }
});
