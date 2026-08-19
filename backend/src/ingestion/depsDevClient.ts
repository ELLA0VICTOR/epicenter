export type DepsDevSystem = "NPM" | "PYPI" | "GO";

export interface DepsDevVersion {
  versionKey: {
    system: DepsDevSystem;
    name: string;
    version: string;
  };
  publishedAt: string;
  isDefault: boolean;
  isDeprecated: boolean;
  deprecatedReason: string;
  links?: Array<{ label: string; url: string }>;
}

export const depsDevVersionUrl = (
  system: DepsDevSystem,
  packageName: string,
  version: string,
): string =>
  `https://api.deps.dev/v3/systems/${system}/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(version)}`;

export async function getDepsDevVersion(
  system: DepsDevSystem,
  packageName: string,
  version: string,
): Promise<DepsDevVersion | null> {
  const url = depsDevVersionUrl(system, packageName, version);
  const response = await fetch(url, {
    headers: { "User-Agent": "epicenter-hack-hydra/0.0.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `deps.dev request failed for ${system}:${packageName}@${version}: HTTP ${response.status}`,
    );
  }

  return (await response.json()) as DepsDevVersion;
}

export function sourceRepositoryOwner(
  metadata: DepsDevVersion,
): { username: string; sourceUrl: string } | null {
  const source = metadata.links?.find(
    (link) =>
      link.label === "SOURCE_REPO" &&
      /^https:\/\/github\.com\//i.test(link.url),
  );
  if (!source) return null;

  const owner = new URL(source.url).pathname.split("/").filter(Boolean)[0];
  if (!owner) return null;

  return { username: `github:${owner}`, sourceUrl: source.url };
}
