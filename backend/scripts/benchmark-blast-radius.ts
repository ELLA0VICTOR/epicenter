import { performance } from "node:perf_hooks";

import { parsePackageLock } from "../src/ingestion/lockfileParser.js";
import { runQuery } from "../src/hydra/client.js";
import { ingestParsedLockfile } from "../src/services/lockfileIngestionService.js";

const REALISTIC_LOCKFILE_URL =
  "https://raw.githubusercontent.com/nodejs/undici/main/package-lock.json";
const EXPOSED_LOCKFILE_URL =
  "https://raw.githubusercontent.com/champjss/mini-shai-hulud-checker-20260512/main/resources/test-fixtures/packages/npm-compromised/package-lock.json";

const blastRadiusQuery = (
  userPackageKeys: string[],
  compromisedPackageKeys: string[],
): string => `
CALL algo.MSpaths({
  sourceLabel: 'PackageVersion',
  sourceProperty: 'key',
  sourceValues: ${JSON.stringify(userPackageKeys)},
  targetValues: ${JSON.stringify(compromisedPackageKeys)},
  pairwise: false,
  relTypes: ['DEPENDS_ON'],
  relDirection: 'outgoing',
  maxLen: 8,
  pathCount: 5,
  resultLimit: 500
})
YIELD path
RETURN path
`;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "epicenter-hack-hydra/0.0.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

const targetResponse = await runQuery(
  "MATCH (v:PackageVersion {compromised: true}) RETURN v.key AS key",
  {},
  { consistency: "strong" },
);
const compromisedPackageKeys = targetResponse.rows.flatMap((row) => {
  const value = row[0]?.value;
  return typeof value === "string" ? [value] : [];
});

for (const [label, url] of [
  ["realistic-clean", REALISTIC_LOCKFILE_URL],
  ["public-exposed-fixture", EXPOSED_LOCKFILE_URL],
] as const) {
  const lockfile = await fetchText(url);
  const parsed = parsePackageLock(lockfile);

  const ingestionStarted = performance.now();
  const ingestion = await ingestParsedLockfile(lockfile, parsed, label);
  const ingestionMs = performance.now() - ingestionStarted;

  const directStarted = performance.now();
  const targetSet = new Set(compromisedPackageKeys);
  const directMatches = ingestion.packageKeys.filter((key) => targetSet.has(key));
  const directMatchMs = performance.now() - directStarted;

  const traversalStarted = performance.now();
  const traversal = await runQuery(
    blastRadiusQuery(ingestion.packageKeys, compromisedPackageKeys),
    {},
    { consistency: "strong", timeoutMs: 30_000 },
  );
  const traversalMs = performance.now() - traversalStarted;

  console.log(
    JSON.stringify(
      {
        label,
        url,
        lockfileVersion: parsed.lockfileVersion,
        packages: parsed.packages.length,
        dependencyEdges: parsed.dependencyEdges.length,
        unresolvedDependencies: parsed.unresolvedDependencies.length,
        compromisedTargets: compromisedPackageKeys.length,
        ingestionMs: Number(ingestionMs.toFixed(2)),
        directMatchMs: Number(directMatchMs.toFixed(4)),
        directMatches,
        traversalMs: Number(traversalMs.toFixed(2)),
        traversalPaths: traversal.rows.length,
        queryId: traversal.query_id,
        firstPath: traversal.rows[0]?.[0] ?? null,
      },
      null,
      2,
    ),
  );
}
