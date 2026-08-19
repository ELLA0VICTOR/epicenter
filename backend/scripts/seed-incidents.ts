import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getDepsDevVersion,
  depsDevVersionUrl,
  sourceRepositoryOwner,
  type DepsDevVersion,
} from "../src/ingestion/depsDevClient.js";
import {
  CAMPAIGN_PACKAGES,
  INCIDENTS,
  type CampaignPackageDefinition,
} from "../src/ingestion/incidentManifest.js";
import {
  getNpmPackageMetadata,
  lastPublishedVersionBefore,
  npmRegistryUrl,
} from "../src/ingestion/npmRegistryClient.js";
import {
  runQuery,
  type HydraParameter,
  type HydraScalar,
} from "../src/hydra/client.js";
import {
  UPSERT_COMPROMISED_IN_QUERY,
  UPSERT_INCIDENTS_QUERY,
  UPSERT_MAINTAINERS_QUERY,
  UPSERT_MAINTAINS_QUERY,
  UPSERT_PACKAGES_QUERY,
  UPSERT_PACKAGE_VERSIONS_QUERY,
  UPSERT_VERSION_OF_QUERY,
} from "../src/hydra/cypher/seedIncidents.js";
import { stableGraphId } from "../src/hydra/ids.js";

type HydraRow = Record<string, HydraScalar>;

interface VersionEvidence {
  version: string;
  compromised: boolean;
  publishedAt: string;
  publishedAtSource: "npm-registry" | "deps.dev" | "incident-report";
  publishedAtPrecision: "exact" | "day" | "minute";
  registryPublishedAt: string;
  metadataStatus: "deps-dev-present" | "removed-from-deps-dev";
  depsDevUrl: string;
}

interface PackageEvidence {
  ecosystem: string;
  name: string;
  incidentId: string;
  incidentSourceUrl: string;
  metadataSource: "npm-registry" | "deps.dev-source-repository";
  metadataSourceUrl: string;
  maintainers: Array<{
    username: string;
    source: "npm-registry" | "deps.dev-source-repository";
    sourceUrl: string;
  }>;
  versions: VersionEvidence[];
}

const incidentById = new Map(INCIDENTS.map((incident) => [incident.id, incident]));

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      const value = values[index];
      if (value === undefined) return;
      results[index] = await mapper(value, index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

async function fetchDepsVersions(
  definition: CampaignPackageDefinition,
  versions: readonly string[],
): Promise<Map<string, DepsDevVersion | null>> {
  const results = await mapWithConcurrency(versions, 4, async (version) => ({
    version,
    metadata: await getDepsDevVersion(
      definition.depsDevSystem,
      definition.name,
      version,
    ),
  }));
  return new Map(results.map((result) => [result.version, result.metadata]));
}

async function enrichPackage(
  definition: CampaignPackageDefinition,
): Promise<PackageEvidence> {
  const incident = incidentById.get(definition.incidentId);
  if (!incident) {
    throw new Error(`Unknown incident ${definition.incidentId}`);
  }

  if (definition.ecosystem === "npm") {
    const registry = await getNpmPackageMetadata(definition.name);
    const excluded = new Set(definition.compromisedVersions);
    const clean = lastPublishedVersionBefore(
      registry,
      incident.compromiseCutoff,
      excluded,
    );
    const versions = [...definition.compromisedVersions, clean.version];
    const depsVersions = await fetchDepsVersions(definition, versions);
    const maintainers = (registry.maintainers ?? []).map((maintainer) => ({
      username: maintainer.name,
      source: "npm-registry" as const,
      sourceUrl: npmRegistryUrl(definition.name),
    }));

    if (maintainers.length === 0) {
      throw new Error(
        `npm returned no maintainers for ${definition.name}; refusing to invent one`,
      );
    }

    const versionEvidence: VersionEvidence[] = versions.map((version) => {
      const publishedAt = registry.time?.[version];
      if (!publishedAt) {
        throw new Error(
          `npm returned no publish timestamp for ${definition.name}@${version}`,
        );
      }
      const deps = depsVersions.get(version) ?? null;
      return {
        version,
        compromised: excluded.has(version),
        publishedAt,
        publishedAtSource: "npm-registry",
        publishedAtPrecision: "exact",
        registryPublishedAt: publishedAt,
        metadataStatus: deps ? "deps-dev-present" : "removed-from-deps-dev",
        depsDevUrl: depsDevVersionUrl("NPM", definition.name, version),
      };
    });

    return {
      ecosystem: definition.ecosystem,
      name: definition.name,
      incidentId: definition.incidentId,
      incidentSourceUrl: definition.sourceUrl,
      metadataSource: "npm-registry",
      metadataSourceUrl: npmRegistryUrl(definition.name),
      maintainers,
      versions: versionEvidence,
    };
  }

  const cleanVersion = definition.cleanVersion;
  if (!cleanVersion) {
    throw new Error(`No sourced clean version configured for ${definition.name}`);
  }

  const versions = [...definition.compromisedVersions, cleanVersion];
  const depsVersions = await fetchDepsVersions(definition, versions);
  const cleanMetadata = depsVersions.get(cleanVersion);
  if (!cleanMetadata) {
    throw new Error(
      `deps.dev returned no clean-version metadata for ${definition.name}@${cleanVersion}`,
    );
  }

  const repositoryOwner = sourceRepositoryOwner(cleanMetadata);
  if (!repositoryOwner) {
    throw new Error(
      `deps.dev returned no GitHub SOURCE_REPO owner for ${definition.name}@${cleanVersion}; refusing to invent a maintainer`,
    );
  }

  const excluded = new Set(definition.compromisedVersions);
  const versionEvidence: VersionEvidence[] = versions.map((version) => {
    const deps = depsVersions.get(version) ?? null;
    const isCompromised = excluded.has(version);
    const reportedPublishedAt = definition.reportedPublishedAt?.[version];
    const publishedAt = isCompromised
      ? (reportedPublishedAt ?? deps?.publishedAt)
      : deps?.publishedAt;

    if (!publishedAt) {
      throw new Error(
        `No API or sourced report timestamp for ${definition.name}@${version}`,
      );
    }

    return {
      version,
      compromised: isCompromised,
      publishedAt,
      publishedAtSource:
        isCompromised && reportedPublishedAt ? "incident-report" : "deps.dev",
      publishedAtPrecision:
        isCompromised && reportedPublishedAt
          ? (definition.reportedTimestampPrecision ?? "day")
          : "exact",
      registryPublishedAt: deps?.publishedAt ?? "",
      metadataStatus: deps ? "deps-dev-present" : "removed-from-deps-dev",
      depsDevUrl: depsDevVersionUrl(
        definition.depsDevSystem,
        definition.name,
        version,
      ),
    };
  });

  return {
    ecosystem: definition.ecosystem,
    name: definition.name,
    incidentId: definition.incidentId,
    incidentSourceUrl: definition.sourceUrl,
    metadataSource: "deps.dev-source-repository",
    metadataSourceUrl: repositoryOwner.sourceUrl,
    maintainers: [
      {
        username: repositoryOwner.username,
        source: "deps.dev-source-repository",
        sourceUrl: repositoryOwner.sourceUrl,
      },
    ],
    versions: versionEvidence,
  };
}

const packageEvidence = await mapWithConcurrency(
  CAMPAIGN_PACKAGES,
  6,
  async (definition, index) => {
    const evidence = await enrichPackage(definition);
    console.log(
      `[metadata ${index + 1}/${CAMPAIGN_PACKAGES.length}] ${evidence.ecosystem}:${evidence.name}`,
    );
    return evidence;
  },
);

const evidencePath = fileURLToPath(
  new URL("../data/seed-evidence.json", import.meta.url),
);
await mkdir(dirname(evidencePath), { recursive: true });
await writeFile(
  evidencePath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        incidents: INCIDENTS.length,
        packages: packageEvidence.length,
        compromisedVersions: packageEvidence.reduce(
          (total, entry) =>
            total + entry.versions.filter((version) => version.compromised).length,
          0,
        ),
      },
      packages: packageEvidence,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const incidentRows: HydraRow[] = INCIDENTS.map((incident) => ({
  id: stableGraphId("incident", incident.id),
  incident_id: incident.id,
  name: incident.name,
  disclosed_at: incident.disclosedAt,
  description: incident.description,
  source_url: incident.sourceUrl,
}));

const packageRows: HydraRow[] = packageEvidence.map((entry) => ({
  id: stableGraphId("package", `${entry.ecosystem}:${entry.name}`),
  name: entry.name,
  ecosystem: entry.ecosystem,
  campaign: true,
  metadata_source: entry.metadataSource,
  metadata_source_url: entry.metadataSourceUrl,
}));

const versionRows: HydraRow[] = packageEvidence.flatMap((entry) =>
  entry.versions.map((version) => {
    const key = `${entry.ecosystem}:${entry.name}@${version.version}`;
    return {
      id: stableGraphId("package-version", key),
      key,
      version: version.version,
      published_at: version.publishedAt,
      published_at_source: version.publishedAtSource,
      published_at_precision: version.publishedAtPrecision,
      registry_published_at: version.registryPublishedAt,
      metadata_status: version.metadataStatus,
      compromised: version.compromised,
    };
  }),
);

const maintainerRows = Array.from(
  new Map(
    packageEvidence
      .flatMap((entry) => entry.maintainers)
      .map((maintainer) => {
        const identity = `${maintainer.source}:${maintainer.username}`;
        const row: HydraRow = {
          id: stableGraphId("maintainer", identity),
          username: maintainer.username,
          metadata_source: maintainer.source,
          metadata_source_url: maintainer.sourceUrl,
        };
        return [row.id, row] as const;
      }),
  ).values(),
);

const versionOfRows: HydraRow[] = packageEvidence.flatMap((entry) => {
  const packageIdentity = `${entry.ecosystem}:${entry.name}`;
  const packageId = stableGraphId("package", packageIdentity);
  return entry.versions.map((version) => {
    const key = `${entry.ecosystem}:${entry.name}@${version.version}`;
    const versionId = stableGraphId("package-version", key);
    return {
      id: stableGraphId("version-of", `${versionId}->${packageId}`),
      source_id: versionId,
      target_id: packageId,
      source: entry.metadataSource,
    };
  });
});

const maintainsRows: HydraRow[] = packageEvidence.flatMap((entry) => {
  const packageId = stableGraphId(
    "package",
    `${entry.ecosystem}:${entry.name}`,
  );
  return entry.maintainers.map((maintainer) => {
    const maintainerId = stableGraphId(
      "maintainer",
      `${maintainer.source}:${maintainer.username}`,
    );
    return {
      id: stableGraphId("maintains", `${maintainerId}->${packageId}`),
      source_id: maintainerId,
      target_id: packageId,
      source: maintainer.source,
    };
  });
});

const compromisedInRows: HydraRow[] = packageEvidence.flatMap((entry) => {
  const incidentId = stableGraphId("incident", entry.incidentId);
  return entry.versions
    .filter((version) => version.compromised)
    .map((version) => {
      const key = `${entry.ecosystem}:${entry.name}@${version.version}`;
      const versionId = stableGraphId("package-version", key);
      return {
        id: stableGraphId("compromised-in", `${versionId}->${incidentId}`),
        source_id: versionId,
        target_id: incidentId,
        source_url: entry.incidentSourceUrl,
      };
    });
});

async function upsertBatch(
  label: string,
  query: string,
  rows: HydraRow[],
): Promise<void> {
  const response = await runQuery(
    query,
    { rows: rows as unknown as HydraParameter },
    { timeoutMs: 30_000 },
  );
  console.log(`[hydra] ${label}: ${rows.length} rows (${response.query_id})`);
}

await upsertBatch("incidents", UPSERT_INCIDENTS_QUERY, incidentRows);
await upsertBatch("packages", UPSERT_PACKAGES_QUERY, packageRows);
await upsertBatch("package versions", UPSERT_PACKAGE_VERSIONS_QUERY, versionRows);
await upsertBatch("maintainers", UPSERT_MAINTAINERS_QUERY, maintainerRows);
await upsertBatch("VERSION_OF", UPSERT_VERSION_OF_QUERY, versionOfRows);
await upsertBatch("MAINTAINS", UPSERT_MAINTAINS_QUERY, maintainsRows);
await upsertBatch(
  "COMPROMISED_IN",
  UPSERT_COMPROMISED_IN_QUERY,
  compromisedInRows,
);

const checks = [
  ["Package", "MATCH (n:Package) RETURN count(*) AS total"],
  ["PackageVersion", "MATCH (n:PackageVersion) RETURN count(*) AS total"],
  ["Maintainer", "MATCH (n:Maintainer) RETURN count(*) AS total"],
  ["Incident", "MATCH (n:Incident) RETURN count(*) AS total"],
] as const;

for (const [label, query] of checks) {
  const response = await runQuery(query);
  console.log(`[verify] ${label}: ${String(response.rows[0]?.[0]?.value)}`);
}

console.log(`[evidence] ${evidencePath}`);
