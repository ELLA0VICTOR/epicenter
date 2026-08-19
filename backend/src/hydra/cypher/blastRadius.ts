export const COMPROMISED_VERSIONS_QUERY = `
MATCH (version:PackageVersion)-[:COMPROMISED_IN]->(incident:Incident)
RETURN version.key AS key,
       incident.incident_id AS incident_id,
       incident.name AS incident_name,
       incident.source_url AS incident_source_url
`;

function literalStringArray(values: readonly string[]): string {
  // JSON string literals are accepted by HydraDB's OpenCypher parser and keep
  // lockfile-controlled values escaped rather than executable as query text.
  return JSON.stringify(values);
}

export function blastRadiusQuery(
  userPackageKeys: readonly string[],
  compromisedPackageKeys: readonly string[],
): string {
  return `
CALL algo.MSpaths({
  sourceLabel: 'PackageVersion',
  sourceProperty: 'key',
  sourceValues: ${literalStringArray(userPackageKeys)},
  targetValues: ${literalStringArray(compromisedPackageKeys)},
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
}
