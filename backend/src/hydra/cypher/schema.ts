/**
 * HydraDB is schema-light and maintains label/property indexes automatically.
 * Current main does not implement CREATE CONSTRAINT or application-managed
 * CREATE INDEX DDL. Its mutation identity is the non-negative integer `id`
 * property, so Epicenter derives deterministic numeric ids while retaining the
 * domain keys (`key`, `name`, `username`, `incident_id`) as indexed properties.
 */
export const GRAPH_LABELS = [
  "Package",
  "PackageVersion",
  "Maintainer",
  "Incident",
  "LockfileSubmission",
] as const;

export const GRAPH_RELATIONSHIP_TYPES = [
  "VERSION_OF",
  "DEPENDS_ON",
  "MAINTAINS",
  "COMPROMISED_IN",
  "RESOLVED",
  "NAME_SIMILAR_TO",
] as const;

export const VERIFY_SCHEMA_QUERY = `
MATCH (i:Incident)
RETURN count(*) AS incident_count
`;
