export const INCIDENT_COMPROMISED_PACKAGES_QUERY = `
MATCH (version:PackageVersion)-[:COMPROMISED_IN]->(incident:Incident {incident_id: $incidentId})
MATCH (version)-[:VERSION_OF]->(package:Package)
RETURN incident.incident_id AS incident_id,
       incident.name AS incident_name,
       package.name AS package_name
ORDER BY package.name
`;

/**
 * Equivalent to spec section 6.5, scoped through the Incident relationship.
 * HydraDB's current HTTP protocol only accepts list parameters as direct
 * UNWIND inputs and its UNWIND/MATCH pipeline cannot continue to a second
 * MATCH. Traversing from Incident avoids client-generated Cypher while keeping
 * the maintainer overlap entirely graph-native; exclusion/collection happens
 * over the returned bounded rows.
 */
export const MAINTAINER_OVERLAP_QUERY = `
MATCH (maintainer:Maintainer)-[:MAINTAINS]->(compromised:Package)<-[:VERSION_OF]-(version:PackageVersion)-[:COMPROMISED_IN]->(incident:Incident {incident_id: $incidentId})
MATCH (maintainer)-[:MAINTAINS]->(other:Package)
RETURN maintainer.username AS maintainer,
       compromised.name AS compromised_package,
       other.name AS other_package
ORDER BY maintainer.username, other.name
`;
