export const INCIDENT_REPLAY_QUERY = `
MATCH (version:PackageVersion)-[:COMPROMISED_IN]->(incident:Incident {incident_id: $incidentId})
MATCH (version)-[:VERSION_OF]->(package:Package)
RETURN version.key AS node_id,
       package.name AS package_name,
       version.version AS version,
       version.published_at AS published_at
ORDER BY version.published_at, package.name, version.version
`;

export const INCIDENT_REPLAY_EXISTS_QUERY = `
MATCH (incident:Incident {incident_id: $incidentId})
RETURN incident.incident_id AS incident_id
`;
