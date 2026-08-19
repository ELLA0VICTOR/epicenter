import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { npmHighImpact } from "npm-high-impact";

import { runQuery, type HydraParameter, type HydraScalar } from "../src/hydra/client.js";
import {
  CLEAR_NAME_SIMILAR_TO_QUERY,
  UPSERT_NAME_SIMILAR_TO_QUERY,
  UPSERT_TYPOSQUAT_REFERENCE_PACKAGES_QUERY,
} from "../src/hydra/cypher/typosquats.js";
import { stableGraphId } from "../src/hydra/ids.js";
import { CAMPAIGN_PACKAGES } from "../src/ingestion/incidentManifest.js";
import { buildTyposquatIndex } from "../src/ingestion/typosquatIndex.js";

type HydraRow = Record<string, HydraScalar>;

const SOURCE_NAME = "npm-high-impact@1.13.0";
const SOURCE_URL = "https://github.com/wooorm/npm-high-impact";
const POPULAR_PACKAGE_COUNT = 2_000;
const MAXIMUM_DISTANCE = 2;

const popularPackages = Array.from(new Set(npmHighImpact)).slice(
  0,
  POPULAR_PACKAGE_COUNT,
);
if (popularPackages.length !== POPULAR_PACKAGE_COUNT) {
  throw new Error(
    `Expected ${POPULAR_PACKAGE_COUNT} popular packages, found ${popularPackages.length}`,
  );
}

const snapshotPath = fileURLToPath(
  new URL("../src/ingestion/popularPackages.json", import.meta.url),
);
await mkdir(dirname(snapshotPath), { recursive: true });
await writeFile(
  snapshotPath,
  `${JSON.stringify(
    {
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      selection: "First 2,000 names in download/dependent rank order",
      packageCount: popularPackages.length,
      packages: popularPackages,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const campaignPackages = Array.from(
  new Map(
    CAMPAIGN_PACKAGES.map((entry) => [
      `${entry.ecosystem}:${entry.name}`,
      entry,
    ]),
  ).values(),
);
const matches = buildTyposquatIndex(
  campaignPackages.map((entry) => entry.name),
  popularPackages,
  MAXIMUM_DISTANCE,
);
const campaignByName = new Map(
  campaignPackages.map((entry) => [entry.name, entry]),
);

const referenceRows: HydraRow[] = Array.from(
  new Set(matches.map((match) => match.similarName)),
).map((name) => ({
  id: stableGraphId("package", `npm:${name}`),
  name,
  ecosystem: "npm",
  typosquat_reference: true,
  metadata_source: SOURCE_NAME,
  metadata_source_url: SOURCE_URL,
}));
const relationshipRows: HydraRow[] = matches.map((match) => {
  const campaign = campaignByName.get(match.sourceName);
  if (!campaign) throw new Error(`Unknown campaign package ${match.sourceName}`);
  const sourceId = stableGraphId(
    "package",
    `${campaign.ecosystem}:${campaign.name}`,
  );
  const targetId = stableGraphId("package", `npm:${match.similarName}`);
  return {
    id: stableGraphId("name-similar-to", `${sourceId}->${targetId}`),
    source_id: sourceId,
    target_id: targetId,
    distance: match.distance,
    source: SOURCE_NAME,
  };
});

async function writeRows(label: string, query: string, rows: HydraRow[]) {
  const result = await runQuery(
    query,
    { rows: rows as unknown as HydraParameter },
    { timeoutMs: 30_000 },
  );
  console.log(`[hydra] ${label}: ${rows.length} rows (${result.query_id})`);
}

const cleared = await runQuery(
  CLEAR_NAME_SIMILAR_TO_QUERY,
  {},
  { consistency: "strong" },
);
console.log(`[hydra] cleared NAME_SIMILAR_TO edges (${cleared.query_id})`);

await writeRows(
  "typosquat reference packages",
  UPSERT_TYPOSQUAT_REFERENCE_PACKAGES_QUERY,
  referenceRows,
);
await writeRows(
  "NAME_SIMILAR_TO",
  UPSERT_NAME_SIMILAR_TO_QUERY,
  relationshipRows,
);

const verification = await runQuery(
  "MATCH (source:Package)-[relationship:NAME_SIMILAR_TO]->(target:Package) RETURN relationship.distance AS distance",
  {},
  { consistency: "strong" },
);
console.log(
  `[verify] corpus=${popularPackages.length}, campaign=${campaignPackages.length}, matches=${verification.rows.length}`,
);
console.log(`[snapshot] ${snapshotPath}`);
