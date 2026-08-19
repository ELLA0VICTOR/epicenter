import { runQuery } from "../src/hydra/client.js";
import {
  GRAPH_LABELS,
  GRAPH_RELATIONSHIP_TYPES,
  VERIFY_SCHEMA_QUERY,
} from "../src/hydra/cypher/schema.js";

const response = await runQuery(VERIFY_SCHEMA_QUERY);

console.log("HydraDB schema capability check passed.");
console.log(`Labels: ${GRAPH_LABELS.join(", ")}`);
console.log(`Relationship types: ${GRAPH_RELATIONSHIP_TYPES.join(", ")}`);
console.log(
  "HydraDB automatically indexes label/property values; no CREATE INDEX or CREATE CONSTRAINT migration is required on current main.",
);
console.log(`Query id: ${response.query_id}`);
