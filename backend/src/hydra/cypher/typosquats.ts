export const UPSERT_TYPOSQUAT_REFERENCE_PACKAGES_QUERY = `
UNWIND $rows AS row
MERGE (package {id: row.id})
SET package:Package,
    package.name = row.name,
    package.ecosystem = row.ecosystem,
    package.typosquat_reference = row.typosquat_reference,
    package.metadata_source = row.metadata_source,
    package.metadata_source_url = row.metadata_source_url
`;

export const UPSERT_NAME_SIMILAR_TO_QUERY = `
UNWIND $rows AS row
MATCH (source:Package {id: row.source_id}), (target:Package {id: row.target_id})
MERGE (source)-[relationship:NAME_SIMILAR_TO {id: row.id}]->(target)
SET relationship.distance = row.distance,
    relationship.source = row.source
`;

export const TYPOSQUAT_MATCHES_QUERY = `
MATCH (source:Package {name: $packageName})-[relationship:NAME_SIMILAR_TO]->(similar:Package)
RETURN source.name AS package_name,
       similar.name AS similar_name,
       similar.ecosystem AS ecosystem,
       relationship.distance AS distance,
       relationship.source AS source
ORDER BY relationship.distance, similar.name
`;
