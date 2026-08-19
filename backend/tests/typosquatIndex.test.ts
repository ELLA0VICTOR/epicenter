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
  assert.deepEqual(buildTyposquatIndex(["mbt"], ["mbt", "ms", "mitt", "react"]), [
    { sourceName: "mbt", similarName: "mitt", distance: 2 },
    { sourceName: "mbt", similarName: "ms", distance: 2 },
  ]);
});
