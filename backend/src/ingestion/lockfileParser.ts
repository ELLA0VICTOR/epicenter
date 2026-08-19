export interface ParsedPackageVersion {
  key: string;
  name: string;
  version: string;
  packagePaths: string[];
}

export interface ParsedDependencyEdge {
  sourceKey: string;
  targetKey: string;
  dependencyName: string;
}

export interface UnresolvedLockfileDependency {
  sourcePath: string;
  sourceKey: string | null;
  dependencyName: string;
}

export interface ParsedLockfile {
  lockfileVersion: 2 | 3;
  rootName: string | null;
  rootVersion: string | null;
  packages: ParsedPackageVersion[];
  dependencyEdges: ParsedDependencyEdge[];
  unresolvedDependencies: UnresolvedLockfileDependency[];
}

interface LockfilePackageEntry {
  name?: unknown;
  version?: unknown;
  link?: unknown;
  dependencies?: unknown;
}

interface LockfileDocument {
  name?: unknown;
  version?: unknown;
  lockfileVersion?: unknown;
  packages?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

function packageNameFromPath(packagePath: string): string | null {
  const normalized = packagePath.replaceAll("\\", "/").replace(/\/$/, "");
  const marker = "node_modules/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex < 0) return null;

  const suffix = normalized.slice(markerIndex + marker.length);
  if (!suffix) return null;
  const segments = suffix.split("/");
  if (segments[0]?.startsWith("@")) {
    return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : null;
  }
  return segments[0] ?? null;
}

function parentPackagePath(packagePath: string): string {
  const normalized = packagePath.replaceAll("\\", "/").replace(/\/$/, "");
  const nestedMarker = "/node_modules/";
  const nestedIndex = normalized.lastIndexOf(nestedMarker);
  if (nestedIndex >= 0) return normalized.slice(0, nestedIndex);
  return "";
}

function dependencyCandidatePaths(
  sourcePath: string,
  dependencyName: string,
): string[] {
  const candidates: string[] = [];
  let current = sourcePath;

  while (current) {
    candidates.push(`${current}/node_modules/${dependencyName}`);
    current = parentPackagePath(current);
  }
  candidates.push(`node_modules/${dependencyName}`);
  return [...new Set(candidates)];
}

function dependencyNames(entry: LockfilePackageEntry): string[] {
  if (!isRecord(entry.dependencies)) return [];
  return Object.keys(entry.dependencies).sort();
}

export function parsePackageLock(lockfileText: string): ParsedLockfile {
  let document: LockfileDocument;
  try {
    document = JSON.parse(lockfileText) as LockfileDocument;
  } catch (error) {
    throw new Error(
      `Invalid package-lock.json: ${error instanceof Error ? error.message : "JSON parse failed"}`,
    );
  }

  if (!isRecord(document)) {
    throw new Error("Invalid package-lock.json: root value must be an object");
  }
  if (document.lockfileVersion !== 2 && document.lockfileVersion !== 3) {
    throw new Error(
      `Unsupported package-lock lockfileVersion ${String(document.lockfileVersion)}; expected 2 or 3`,
    );
  }
  if (!isRecord(document.packages)) {
    throw new Error(
      "Invalid package-lock.json: lockfileVersion 2/3 requires a packages object",
    );
  }

  const entries = new Map<string, LockfilePackageEntry>();
  for (const [rawPath, value] of Object.entries(document.packages)) {
    if (!isRecord(value)) continue;
    entries.set(rawPath.replaceAll("\\", "/").replace(/\/$/, ""), value);
  }

  const packageByPath = new Map<string, ParsedPackageVersion>();
  for (const [packagePath, entry] of entries) {
    if (packagePath === "" || entry.link === true) continue;

    const name = stringOrNull(entry.name) ?? packageNameFromPath(packagePath);
    const version = stringOrNull(entry.version);
    if (!name || !version) continue;

    packageByPath.set(packagePath, {
      key: `npm:${name}@${version}`,
      name,
      version,
      packagePaths: [packagePath],
    });
  }

  const packagesByKey = new Map<string, ParsedPackageVersion>();
  for (const parsedPackage of packageByPath.values()) {
    const existing = packagesByKey.get(parsedPackage.key);
    if (existing) {
      existing.packagePaths.push(...parsedPackage.packagePaths);
    } else {
      packagesByKey.set(parsedPackage.key, { ...parsedPackage });
    }
  }

  const edgeByEndpoints = new Map<string, ParsedDependencyEdge>();
  const unresolvedDependencies: UnresolvedLockfileDependency[] = [];
  for (const [sourcePath, entry] of entries) {
    const sourcePackage = sourcePath === "" ? null : packageByPath.get(sourcePath);
    for (const dependencyName of dependencyNames(entry)) {
      const targetPackage = dependencyCandidatePaths(sourcePath, dependencyName)
        .map((candidate) => packageByPath.get(candidate))
        .find((candidate) => candidate !== undefined);

      if (!targetPackage) {
        unresolvedDependencies.push({
          sourcePath,
          sourceKey: sourcePackage?.key ?? null,
          dependencyName,
        });
        continue;
      }

      // The root is represented by LockfileSubmission rather than PackageVersion.
      if (!sourcePackage) continue;
      const identity = `${sourcePackage.key}->${targetPackage.key}`;
      if (!edgeByEndpoints.has(identity)) {
        edgeByEndpoints.set(identity, {
          sourceKey: sourcePackage.key,
          targetKey: targetPackage.key,
          dependencyName,
        });
      }
    }
  }

  return {
    lockfileVersion: document.lockfileVersion,
    rootName: stringOrNull(document.name),
    rootVersion: stringOrNull(document.version),
    packages: [...packagesByKey.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    dependencyEdges: [...edgeByEndpoints.values()].sort((left, right) =>
      `${left.sourceKey}\0${left.targetKey}`.localeCompare(
        `${right.sourceKey}\0${right.targetKey}`,
      ),
    ),
    unresolvedDependencies,
  };
}
