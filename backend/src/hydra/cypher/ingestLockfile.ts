export const UPSERT_LOCKFILE_SUBMISSIONS_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:LockfileSubmission,
    n.submission_id = row.submission_id,
    n.source_label = row.source_label,
    n.submitted_at = row.submitted_at,
    n.lockfile_version = row.lockfile_version,
    n.package_count = row.package_count
`;

export const UPSERT_INGESTED_PACKAGE_VERSIONS_QUERY = `
UNWIND $rows AS row
MERGE (n {id: row.id})
SET n:PackageVersion,
    n.key = row.key,
    n.name = row.name,
    n.version = row.version,
    n.ecosystem = row.ecosystem,
    n.last_seen_at = row.last_seen_at
`;

export const UPSERT_DEPENDS_ON_QUERY = `
UNWIND $rows AS row
MATCH (source:PackageVersion {id: row.source_id}), (target:PackageVersion {id: row.target_id})
MERGE (source)-[relationship:DEPENDS_ON {id: row.id}]->(target)
SET relationship.dependency_name = row.dependency_name
`;

export const UPSERT_RESOLVED_QUERY = `
UNWIND $rows AS row
MATCH (submission:LockfileSubmission {id: row.source_id}), (version:PackageVersion {id: row.target_id})
MERGE (submission)-[relationship:RESOLVED {id: row.id}]->(version)
SET relationship.source_label = row.source_label
`;
