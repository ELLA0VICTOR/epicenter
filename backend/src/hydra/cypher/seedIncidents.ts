export const UPSERT_INCIDENTS_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:Incident,
    n.incident_id = row.incident_id,
    n.name = row.name,
    n.disclosed_at = row.disclosed_at,
    n.description = row.description,
    n.source_url = row.source_url
`;

export const UPSERT_PACKAGES_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:Package,
    n.name = row.name,
    n.ecosystem = row.ecosystem,
    n.campaign = row.campaign,
    n.metadata_source = row.metadata_source,
    n.metadata_source_url = row.metadata_source_url
`;

export const UPSERT_PACKAGE_VERSIONS_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:PackageVersion,
    n.key = row.key,
    n.version = row.version,
    n.published_at = row.published_at,
    n.published_at_source = row.published_at_source,
    n.published_at_precision = row.published_at_precision,
    n.registry_published_at = row.registry_published_at,
    n.metadata_status = row.metadata_status,
    n.compromised = row.compromised
`;

export const UPSERT_MAINTAINERS_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:Maintainer,
    n.username = row.username,
    n.metadata_source = row.metadata_source,
    n.metadata_source_url = row.metadata_source_url
`;

export const UPSERT_VERSION_OF_QUERY = `
UNWIND $rows AS row
MATCH (v:PackageVersion {id: row.source_id}), (p:Package {id: row.target_id})
MERGE (v)-[r:VERSION_OF {id: row.id}]->(p)
SET r.source = row.source
`;

export const UPSERT_MAINTAINS_QUERY = `
UNWIND $rows AS row
MATCH (m:Maintainer {id: row.source_id}), (p:Package {id: row.target_id})
MERGE (m)-[r:MAINTAINS {id: row.id}]->(p)
SET r.source = row.source
`;

export const UPSERT_COMPROMISED_IN_QUERY = `
UNWIND $rows AS row
MATCH (v:PackageVersion {id: row.source_id}), (i:Incident {id: row.target_id})
MERGE (v)-[r:COMPROMISED_IN {id: row.id}]->(i)
SET r.source_url = row.source_url
`;
