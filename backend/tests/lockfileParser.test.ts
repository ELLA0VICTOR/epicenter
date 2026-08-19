import assert from "node:assert/strict";
import test from "node:test";

import { parsePackageLock } from "../src/ingestion/lockfileParser.js";

for (const lockfileVersion of [2, 3] as const) {
  test(`parses lockfile v${lockfileVersion} and resolves hoisted and nested dependencies`, () => {
    const parsed = parsePackageLock(
      JSON.stringify({
        name: "parser-fixture",
        version: "1.0.0",
        lockfileVersion,
        packages: {
          "": { dependencies: { alpha: "1.0.0" } },
          "node_modules/alpha": {
            version: "1.0.0",
            dependencies: { beta: "1.0.0", gamma: "2.0.0" },
          },
          "node_modules/beta": { version: "1.0.0" },
          "node_modules/alpha/node_modules/gamma": { version: "2.0.0" },
        },
      }),
    );

    assert.equal(parsed.lockfileVersion, lockfileVersion);
    assert.deepEqual(
      parsed.packages.map((entry) => entry.key),
      ["npm:alpha@1.0.0", "npm:beta@1.0.0", "npm:gamma@2.0.0"],
    );
    assert.deepEqual(parsed.dependencyEdges, [
      {
        sourceKey: "npm:alpha@1.0.0",
        targetKey: "npm:beta@1.0.0",
        dependencyName: "beta",
      },
      {
        sourceKey: "npm:alpha@1.0.0",
        targetKey: "npm:gamma@2.0.0",
        dependencyName: "gamma",
      },
    ]);
    assert.deepEqual(parsed.unresolvedDependencies, []);
  });
}

test("deduplicates the same package version installed at multiple paths", () => {
  const parsed = parsePackageLock(
    JSON.stringify({
      lockfileVersion: 3,
      packages: {
        "": {},
        "node_modules/alpha": { version: "1.0.0" },
        "node_modules/tool/node_modules/alpha": { version: "1.0.0" },
      },
    }),
  );

  assert.equal(parsed.packages.length, 1);
  assert.deepEqual(parsed.packages[0]?.packagePaths, [
    "node_modules/alpha",
    "node_modules/tool/node_modules/alpha",
  ]);
});

test("rejects unsupported and malformed lockfiles", () => {
  assert.throws(() => parsePackageLock("{"), /Invalid package-lock\.json/);
  assert.throws(
    () => parsePackageLock(JSON.stringify({ lockfileVersion: 1 })),
    /expected 2 or 3/,
  );
});
