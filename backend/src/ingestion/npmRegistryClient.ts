export interface NpmMaintainer {
  name: string;
  email?: string;
}

export interface NpmPackageMetadata {
  name: string;
  maintainers?: NpmMaintainer[];
  time?: Record<string, string>;
  versions?: Record<string, unknown>;
}

export const npmRegistryUrl = (packageName: string): string =>
  `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

export async function getNpmPackageMetadata(
  packageName: string,
): Promise<NpmPackageMetadata> {
  const url = npmRegistryUrl(packageName);
  const response = await fetch(url, {
    headers: { "User-Agent": "epicenter-hack-hydra/0.0.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `npm registry metadata request failed for ${packageName}: HTTP ${response.status}`,
    );
  }

  return (await response.json()) as NpmPackageMetadata;
}

export function lastPublishedVersionBefore(
  metadata: NpmPackageMetadata,
  cutoffIso: string,
  excludedVersions: ReadonlySet<string>,
): { version: string; publishedAt: string } {
  const cutoff = Date.parse(cutoffIso);
  const candidates = Object.entries(metadata.time ?? {})
    .filter(([version, publishedAt]) => {
      if (version === "created" || version === "modified") return false;
      if (excludedVersions.has(version)) return false;
      const timestamp = Date.parse(publishedAt);
      return Number.isFinite(timestamp) && timestamp < cutoff;
    })
    .sort((left, right) => Date.parse(right[1]) - Date.parse(left[1]));

  const candidate = candidates[0];
  if (!candidate) {
    throw new Error(
      `No clean release found for ${metadata.name} before ${cutoffIso}`,
    );
  }

  return { version: candidate[0], publishedAt: candidate[1] };
}
