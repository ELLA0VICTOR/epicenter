import { stableGraphId } from "../hydra/ids.js";

type EncodedHydraProperty = Record<string, unknown>;

export interface HydraPathNode {
  id: number;
  labels: string[];
  properties: Record<string, EncodedHydraProperty>;
}

export interface HydraPathRelationship {
  id: number;
  edge_type: string;
  src: number;
  dst: number;
  properties: Record<string, EncodedHydraProperty>;
}

export interface HydraPath {
  nodes: HydraPathNode[];
  relationships: HydraPathRelationship[];
}

export interface GraphPayloadNode {
  id: string;
  key: string;
  name: string;
  version: string;
  labels: string[];
  compromised: boolean;
  direct: boolean;
}

export interface GraphPayloadEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphPayload {
  nodes: GraphPayloadNode[];
  edges: GraphPayloadEdge[];
}

export function decodeHydraProperty(value: unknown): unknown {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return value;
  }

  const entries = Object.entries(value);
  if (entries.length !== 1) return value;
  const entry = entries[0];
  return entry?.[1];
}

export function hydraNodeProperty(
  node: HydraPathNode,
  property: string,
): unknown {
  return decodeHydraProperty(node.properties[property]);
}

export function packageNameFromKey(key: string): string {
  const withoutEcosystem = key.startsWith("npm:") ? key.slice(4) : key;
  const versionSeparator = withoutEcosystem.lastIndexOf("@");
  return versionSeparator > 0
    ? withoutEcosystem.slice(0, versionSeparator)
    : withoutEcosystem;
}

export function packageVersionFromKey(key: string): string {
  const versionSeparator = key.lastIndexOf("@");
  return versionSeparator >= 0 ? key.slice(versionSeparator + 1) : "";
}

export function mapPathsToGraphPayload(
  paths: readonly HydraPath[],
  directPackageKeys: readonly string[],
  compromisedPackageKeys: ReadonlySet<string>,
): GraphPayload {
  const directSet = new Set(directPackageKeys);
  const nodes = new Map<string, GraphPayloadNode>();
  const edges = new Map<string, GraphPayloadEdge>();

  for (const path of paths) {
    for (const node of path.nodes) {
      const keyValue = hydraNodeProperty(node, "key");
      if (typeof keyValue !== "string") continue;
      const id = String(node.id);
      const existing = nodes.get(id);
      nodes.set(id, {
        id,
        key: keyValue,
        name:
          typeof hydraNodeProperty(node, "name") === "string"
            ? String(hydraNodeProperty(node, "name"))
            : packageNameFromKey(keyValue),
        version:
          typeof hydraNodeProperty(node, "version") === "string"
            ? String(hydraNodeProperty(node, "version"))
            : packageVersionFromKey(keyValue),
        labels: node.labels,
        compromised:
          existing?.compromised === true || compromisedPackageKeys.has(keyValue),
        direct: existing?.direct === true || directSet.has(keyValue),
      });
    }

    for (const relationship of path.relationships) {
      const propertyId = decodeHydraProperty(relationship.properties.id);
      const id = String(
        typeof propertyId === "number" ? propertyId : relationship.id,
      );
      edges.set(id, {
        id,
        source: String(relationship.src),
        target: String(relationship.dst),
        type: relationship.edge_type,
      });
    }
  }

  for (const key of directSet) {
    if ([...nodes.values()].some((node) => node.key === key)) continue;
    const id = String(stableGraphId("package-version", key));
    nodes.set(id, {
      id,
      key,
      name: packageNameFromKey(key),
      version: packageVersionFromKey(key),
      labels: ["PackageVersion"],
      compromised: true,
      direct: true,
    });
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
