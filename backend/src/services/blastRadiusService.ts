import { performance } from "node:perf_hooks";

import type { ParsedLockfile } from "../ingestion/lockfileParser.js";
import { runQuery, type HydraQueryValue } from "../hydra/client.js";
import {
  blastRadiusQuery,
  COMPROMISED_VERSIONS_QUERY,
} from "../hydra/cypher/blastRadius.js";
import {
  hydraNodeProperty,
  mapPathsToGraphPayload,
  type GraphPayload,
  type HydraPath,
} from "./graphPayloadMapper.js";

interface CompromisedVersion {
  key: string;
  incidentId: string;
  incidentName: string;
  incidentSourceUrl: string;
}

export interface ExposurePath {
  nodeIds: string[];
  packageKeys: string[];
}

export interface Exposure {
  compromisedKey: string;
  type: "direct" | "transitive";
  incident: {
    id: string;
    name: string;
    sourceUrl: string;
  };
  paths: ExposurePath[];
}

export interface BlastRadiusResult {
  exposed: boolean;
  directExposureCount: number;
  transitiveExposureCount: number;
  exposures: Exposure[];
  graph: GraphPayload;
  traversal: {
    status: "complete";
    queryId: string;
    rawPathCount: number;
    acceptedPathCount: number;
  };
  timing: {
    compromisedLookupMs: number;
    directMatchMs: number;
    traversalMs: number;
  };
}

function scalarString(value: HydraQueryValue | undefined): string | null {
  return typeof value?.value === "string" ? value.value : null;
}

function readHydraPath(value: HydraQueryValue | undefined): HydraPath | null {
  if (value?.type !== "path" || typeof value.value !== "object" || !value.value) {
    return null;
  }
  return value.value as HydraPath;
}

function validatedPaths(
  paths: readonly HydraPath[],
  parsed: ParsedLockfile,
  compromisedKeys: ReadonlySet<string>,
): HydraPath[] {
  const submittedKeys = new Set(parsed.packages.map((entry) => entry.key));
  const submittedEdges = new Set(
    parsed.dependencyEdges.map(
      (edge) => `${edge.sourceKey}\0${edge.targetKey}`,
    ),
  );

  return paths.filter((path) => {
    if (path.nodes.length < 2 || path.relationships.length < 1) return false;
    const nodeKeyById = new Map<number, string>();
    for (const node of path.nodes) {
      const key = hydraNodeProperty(node, "key");
      if (typeof key !== "string" || !submittedKeys.has(key)) return false;
      nodeKeyById.set(node.id, key);
    }

    for (const relationship of path.relationships) {
      const sourceKey = nodeKeyById.get(relationship.src);
      const targetKey = nodeKeyById.get(relationship.dst);
      if (
        !sourceKey ||
        !targetKey ||
        !submittedEdges.has(`${sourceKey}\0${targetKey}`)
      ) {
        return false;
      }
    }

    const targetKey = hydraNodeProperty(path.nodes.at(-1)!, "key");
    return typeof targetKey === "string" && compromisedKeys.has(targetKey);
  });
}

export async function analyzeBlastRadius(
  parsed: ParsedLockfile,
): Promise<BlastRadiusResult> {
  const compromisedLookupStarted = performance.now();
  const compromisedResponse = await runQuery(
    COMPROMISED_VERSIONS_QUERY,
    {},
    { consistency: "strong" },
  );
  const compromisedVersions = compromisedResponse.rows.flatMap((row) => {
    const key = scalarString(row[0]);
    const incidentId = scalarString(row[1]);
    const incidentName = scalarString(row[2]);
    const incidentSourceUrl = scalarString(row[3]);
    return key && incidentId && incidentName && incidentSourceUrl
      ? [{ key, incidentId, incidentName, incidentSourceUrl }]
      : [];
  });
  const compromisedLookupMs = performance.now() - compromisedLookupStarted;
  const compromisedByKey = new Map(
    compromisedVersions.map((entry) => [entry.key, entry]),
  );
  const compromisedKeys = new Set(compromisedByKey.keys());
  const userPackageKeys = parsed.packages.map((entry) => entry.key);

  const directMatchStarted = performance.now();
  const directPackageKeys = userPackageKeys.filter((key) =>
    compromisedKeys.has(key),
  );
  const directMatchMs = performance.now() - directMatchStarted;

  const traversalStarted = performance.now();
  const traversalResponse = await runQuery(
    blastRadiusQuery(userPackageKeys, [...compromisedKeys]),
    {},
    { consistency: "strong", timeoutMs: 30_000 },
  );
  const traversalMs = performance.now() - traversalStarted;
  const rawPaths = traversalResponse.rows.flatMap((row) => {
    const path = readHydraPath(row[0]);
    return path ? [path] : [];
  });
  const paths = validatedPaths(rawPaths, parsed, compromisedKeys);

  const pathsByTarget = new Map<string, HydraPath[]>();
  for (const path of paths) {
    const key = hydraNodeProperty(path.nodes.at(-1)!, "key");
    if (typeof key !== "string") continue;
    const targetPaths = pathsByTarget.get(key) ?? [];
    targetPaths.push(path);
    pathsByTarget.set(key, targetPaths);
  }

  const allExposedKeys = new Set([...directPackageKeys, ...pathsByTarget.keys()]);
  const directSet = new Set(directPackageKeys);
  const exposures: Exposure[] = [...allExposedKeys].flatMap((key) => {
    const metadata = compromisedByKey.get(key);
    if (!metadata) return [];
    const targetPaths = pathsByTarget.get(key) ?? [];
    return [
      {
        compromisedKey: key,
        type: directSet.has(key) ? ("direct" as const) : ("transitive" as const),
        incident: {
          id: metadata.incidentId,
          name: metadata.incidentName,
          sourceUrl: metadata.incidentSourceUrl,
        },
        paths:
          targetPaths.length > 0
            ? targetPaths.map((path) => ({
                nodeIds: path.nodes.map((node) => String(node.id)),
                packageKeys: path.nodes.flatMap((node) => {
                  const nodeKey = hydraNodeProperty(node, "key");
                  return typeof nodeKey === "string" ? [nodeKey] : [];
                }),
              }))
            : [
                {
                  nodeIds: [],
                  packageKeys: [key],
                },
              ],
      },
    ];
  });

  const graph = mapPathsToGraphPayload(
    paths,
    directPackageKeys,
    compromisedKeys,
  );
  // Fill the deterministic graph id into direct single-node paths after mapping.
  for (const exposure of exposures) {
    if (exposure.type !== "direct") continue;
    for (const path of exposure.paths) {
      if (path.nodeIds.length > 0) continue;
      const node = graph.nodes.find(
        (candidate) => candidate.key === exposure.compromisedKey,
      );
      if (node) path.nodeIds.push(node.id);
    }
  }

  return {
    exposed: exposures.length > 0,
    directExposureCount: exposures.filter((entry) => entry.type === "direct")
      .length,
    transitiveExposureCount: exposures.filter(
      (entry) => entry.type === "transitive",
    ).length,
    exposures,
    graph,
    traversal: {
      status: "complete",
      queryId: traversalResponse.query_id,
      rawPathCount: rawPaths.length,
      acceptedPathCount: paths.length,
    },
    timing: {
      compromisedLookupMs: Number(compromisedLookupMs.toFixed(2)),
      directMatchMs: Number(directMatchMs.toFixed(4)),
      traversalMs: Number(traversalMs.toFixed(2)),
    },
  };
}
