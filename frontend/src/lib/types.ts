export interface Incident {
  id: string;
  name: string;
  disclosedAt: string;
  description: string;
  sourceUrl: string;
  compromisedVersionCount: number;
}

export interface IncidentSummary {
  packageCount: number;
  compromisedVersionCount: number;
  incidentCount: number;
  maintainerCount: number;
}

export interface IncidentsResponse {
  incidents: Incident[];
  summary: IncidentSummary;
}

export interface GraphNode {
  id: string;
  key: string;
  name: string;
  version: string;
  labels: string[];
  compromised: boolean;
  direct: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface Exposure {
  compromisedKey: string;
  type: "direct" | "transitive";
  incident: { id: string; name: string; sourceUrl: string };
  paths: Array<{ nodeIds: string[]; packageKeys: string[] }>;
}

export interface AnalyzeResponse {
  submission: {
    id: string;
    sourceLabel: string;
    lockfileVersion: 2 | 3;
    rootName: string | null;
    rootVersion: string | null;
    packageCount: number;
    dependencyEdgeCount: number;
    unresolvedDependencyCount: number;
  };
  exposure: {
    exposed: boolean;
    directCount: number;
    transitiveCount: number;
    totalCount: number;
  };
  exposures: Exposure[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  traversal: {
    status: "complete";
    queryId: string;
    rawPathCount: number;
    acceptedPathCount: number;
  };
  timing: {
    parseMs: number;
    ingestionMs: number;
    compromisedLookupMs: number;
    directMatchMs: number;
    traversalMs: number;
    totalMs: number;
  };
}

export interface MaintainerOverlapResponse {
  incident: { id: string; name: string };
  compromisedPackageNames: string[];
  overlaps: Array<{ maintainer: string; otherPackages: string[] }>;
  summary: {
    compromisedPackageCount: number;
    maintainerCount: number;
    overlapPackageCount: number;
  };
}

export interface TyposquatResponse {
  packageName: string;
  matches: Array<{
    name: string;
    ecosystem: string;
    distance: number;
    source: string;
  }>;
  summary: { matchCount: number; maximumDistance: number };
  corpus: { name: string; packageCount: number; sourceUrl: string };
}
