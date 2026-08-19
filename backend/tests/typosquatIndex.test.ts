import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTyposquatIndex,
  levenshteinDistance,
} from "../src/ingestion/typosquatIndex.js";

test("computes canonical Levenshtein distances", () => {
  assert.equal(levenshteinDistance("kitten", "sitting"), 3);
  assert.equal(levenshteinDistance("mbt", "mitt"), 2);
  assert.equal(levenshteinDistance("react", "react"), 0);
});

test("keeps non-identical package names within the configured distance", () => {
  assert.deepEqual(
    buildTyposquatIndex(
      ["eslint"],
      ["eslint", "tslint", "es-lint", "react"],
    ),
    [
      { sourceName: "eslint", similarName: "es-lint", distance: 1 },
      { sourceName: "eslint", similarName: "tslint", distance: 1 },
    ],
  );
});

test("skips short seeded and popular package names", () => {
  assert.deepEqual(
    buildTyposquatIndex(
      [" mbt ", "eslint"],
      ["mitt", "ms", "es-lint", "tslint"],
    ),
    [
      { sourceName: "eslint", similarName: "es-lint", distance: 1 },
      { sourceName: "eslint", similarName: "tslint", distance: 1 },
    ],
  );
});
