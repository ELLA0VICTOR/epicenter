import assert from "node:assert/strict";
import test from "node:test";

import {
  mapPathsToGraphPayload,
  type HydraPath,
} from "../src/services/graphPayloadMapper.js";

test("maps a hydrated Hydra path into deduplicated frontend nodes and edges", () => {
  const path: HydraPath = {
    nodes: [
      {
        id: 1,
        labels: ["PackageVersion"],
        properties: {
          key: { String: "npm:parent@1.0.0" },
          name: { String: "parent" },
          version: { String: "1.0.0" },
        },
      },
      {
        id: 2,
        labels: ["PackageVersion"],
        properties: {
          key: { String: "npm:@tanstack/history@1.161.9" },
          version: { String: "1.161.9" },
        },
      },
    ],
    relationships: [
      {
        id: 7,
        edge_type: "DEPENDS_ON",
        src: 1,
        dst: 2,
        properties: { id: { Integer: 99 } },
      },
    ],
  };

  const graph = mapPathsToGraphPayload(
    [path],
    ["npm:@tanstack/history@1.161.9"],
    new Set(["npm:@tanstack/history@1.161.9"]),
  );

  assert.deepEqual(graph.edges, [
    { id: "99", source: "1", target: "2", type: "DEPENDS_ON" },
  ]);
  assert.deepEqual(
    graph.nodes.map(({ id, key, name, compromised, direct }) => ({
      id,
      key,
      name,
      compromised,
      direct,
    })),
    [
      {
        id: "1",
        key: "npm:parent@1.0.0",
        name: "parent",
        compromised: false,
        direct: false,
      },
      {
        id: "2",
        key: "npm:@tanstack/history@1.161.9",
        name: "@tanstack/history",
        compromised: true,
        direct: true,
      },
    ],
  );
});
