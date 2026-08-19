import { createHash } from "node:crypto";

import type { ParsedLockfile } from "../ingestion/lockfileParser.js";
import {
  runQuery,
  type HydraParameter,
  type HydraScalar,
} from "../hydra/client.js";
import {
  UPSERT_DEPENDS_ON_QUERY,
  UPSERT_INGESTED_PACKAGE_VERSIONS_QUERY,
  UPSERT_LOCKFILE_SUBMISSIONS_QUERY,
  UPSERT_RESOLVED_QUERY,
} from "../hydra/cypher/ingestLockfile.js";
import { stableGraphId } from "../hydra/ids.js";

type HydraRow = Record<string, HydraScalar>;

export interface LockfileIngestionResult {
  submissionId: string;
  submissionVertexId: number;
  packageKeys: string[];
  packageCount: number;
  dependencyEdgeCount: number;
  unresolvedDependencyCount: number;
  queryIds: string[];
}

const BATCH_SIZE = 250;

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function upsertRows(
  query: string,
  rows: HydraRow[],
  queryIds: string[],
): Promise<void> {
  for (const batch of chunks(rows, BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const response = await runQuery(
      query,
      { rows: batch as unknown as HydraParameter },
      { timeoutMs: 30_000 },
    );
    queryIds.push(response.query_id);
  }
}

export function lockfileSubmissionId(lockfileText: string): string {
  return createHash("sha256").update(lockfileText).digest("hex");
}

export async function ingestParsedLockfile(
  lockfileText: string,
  parsed: ParsedLockfile,
  sourceLabel: string,
): Promise<LockfileIngestionResult> {
  const submissionId = lockfileSubmissionId(lockfileText);
  const submissionVertexId = stableGraphId("lockfile-submission", submissionId);
  const observedAt = new Date().toISOString();
  const queryIds: string[] = [];

  await upsertRows(
    UPSERT_LOCKFILE_SUBMISSIONS_QUERY,
    [
      {
        id: submissionVertexId,
        submission_id: submissionId,
        source_label: sourceLabel,
        submitted_at: observedAt,
        lockfile_version: parsed.lockfileVersion,
        package_count: parsed.packages.length,
      },
    ],
    queryIds,
  );

  const packageRows: HydraRow[] = parsed.packages.map((entry) => ({
    id: stableGraphId("package-version", entry.key),
    key: entry.key,
    name: entry.name,
    version: entry.version,
    ecosystem: "npm",
    last_seen_at: observedAt,
  }));
  await upsertRows(
    UPSERT_INGESTED_PACKAGE_VERSIONS_QUERY,
    packageRows,
    queryIds,
  );

  const dependencyRows: HydraRow[] = parsed.dependencyEdges.map((edge) => {
    const sourceId = stableGraphId("package-version", edge.sourceKey);
    const targetId = stableGraphId("package-version", edge.targetKey);
    return {
      id: stableGraphId("depends-on", `${sourceId}->${targetId}`),
      source_id: sourceId,
      target_id: targetId,
      dependency_name: edge.dependencyName,
    };
  });
  await upsertRows(UPSERT_DEPENDS_ON_QUERY, dependencyRows, queryIds);

  const resolvedRows: HydraRow[] = parsed.packages.map((entry) => {
    const targetId = stableGraphId("package-version", entry.key);
    return {
      id: stableGraphId("resolved", `${submissionVertexId}->${targetId}`),
      source_id: submissionVertexId,
      target_id: targetId,
      source_label: sourceLabel,
    };
  });
  await upsertRows(UPSERT_RESOLVED_QUERY, resolvedRows, queryIds);

  return {
    submissionId,
    submissionVertexId,
    packageKeys: parsed.packages.map((entry) => entry.key),
    packageCount: parsed.packages.length,
    dependencyEdgeCount: parsed.dependencyEdges.length,
    unresolvedDependencyCount: parsed.unresolvedDependencies.length,
    queryIds,
  };
}
