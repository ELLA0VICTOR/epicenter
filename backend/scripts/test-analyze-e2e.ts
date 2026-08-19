import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { app } from "../src/app.js";
import { runQuery } from "../src/hydra/client.js";

const CLEAN_LOCKFILE_URL =
  "https://raw.githubusercontent.com/nodejs/undici/main/package-lock.json";
const EXPOSED_LOCKFILE_URL =
  "https://raw.githubusercontent.com/champjss/mini-shai-hulud-checker-20260512/main/resources/test-fixtures/packages/npm-compromised/package-lock.json";

interface AnalyzeResponse {
  submission: {
    id: string;
    packageCount: number;
    dependencyEdgeCount: number;
  };
  exposure: {
    exposed: boolean;
    directCount: number;
    transitiveCount: number;
    totalCount: number;
  };
  exposures: Array<{
    compromisedKey: string;
    type: string;
    paths: Array<{ nodeIds: string[]; packageKeys: string[] }>;
  }>;
  graph: {
    nodes: Array<{ id: string; key: string; compromised: boolean }>;
    edges: unknown[];
  };
  traversal: {
    status: string;
    rawPathCount: number;
    acceptedPathCount: number;
  };
  timing: Record<string, number>;
}

async function fetchLockfile(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "epicenter-hack-hydra/0.0.0" },
  });
  assert.equal(response.status, 200, `failed to fetch ${url}`);
  return response.text();
}

const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});

try {
  const address = server.address() as AddressInfo;
  const endpoint = `http://127.0.0.1:${address.port}/api/analyze`;
  const [exposedLockfile, cleanLockfile] = await Promise.all([
    fetchLockfile(EXPOSED_LOCKFILE_URL),
    fetchLockfile(CLEAN_LOCKFILE_URL),
  ]);

  const analyze = async (
    lockfile: string,
    sourceLabel: string,
  ): Promise<AnalyzeResponse> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockfile, sourceLabel }),
    });
    const body = (await response.json()) as AnalyzeResponse | { error: string };
    assert.equal(
      response.status,
      200,
      "error" in body ? body.error : `HTTP ${response.status}`,
    );
    return body as AnalyzeResponse;
  };

  // Analyze exposed first so the clean result is also checked after compromised
  // submission data is already present in the shared graph.
  const exposed = await analyze(exposedLockfile, "public-exposed-lockfile");
  assert.equal(exposed.submission.packageCount, 2);
  assert.deepEqual(exposed.exposure, {
    exposed: true,
    directCount: 2,
    transitiveCount: 0,
    totalCount: 2,
  });
  assert.deepEqual(
    exposed.exposures.map((entry) => entry.compromisedKey).sort(),
    [
      "npm:@tanstack/react-router@1.169.5",
      "npm:@tanstack/router-core@1.169.5",
    ],
  );
  for (const exposure of exposed.exposures) {
    assert.equal(exposure.type, "direct");
    assert.deepEqual(exposure.paths[0]?.packageKeys, [exposure.compromisedKey]);
    assert.equal(exposure.paths[0]?.nodeIds.length, 1);
    assert.ok(
      exposed.graph.nodes.some(
        (node) =>
          node.id === exposure.paths[0]?.nodeIds[0] &&
          node.key === exposure.compromisedKey &&
          node.compromised,
      ),
    );
  }
  assert.equal(exposed.graph.edges.length, 0);

  const clean = await analyze(cleanLockfile, "nodejs/undici");
  assert.equal(clean.submission.packageCount, 689);
  assert.equal(clean.submission.dependencyEdgeCount, 1_392);
  assert.deepEqual(clean.exposure, {
    exposed: false,
    directCount: 0,
    transitiveCount: 0,
    totalCount: 0,
  });
  assert.deepEqual(clean.exposures, []);
  assert.deepEqual(clean.graph, { nodes: [], edges: [] });

  const repeated = await analyze(exposedLockfile, "public-exposed-lockfile");
  assert.equal(repeated.submission.id, exposed.submission.id);
  const submissionCount = await runQuery(
    `MATCH (submission:LockfileSubmission {submission_id: ${JSON.stringify(exposed.submission.id)}}) RETURN count(*) AS total`,
    {},
    { consistency: "strong" },
  );
  assert.equal(submissionCount.rows[0]?.[0]?.value, 1);

  console.log(
    JSON.stringify(
      {
        exposed: {
          source: EXPOSED_LOCKFILE_URL,
          packages: exposed.submission.packageCount,
          exposure: exposed.exposure,
          compromisedKeys: exposed.exposures.map(
            (entry) => entry.compromisedKey,
          ),
          timing: exposed.timing,
        },
        clean: {
          source: CLEAN_LOCKFILE_URL,
          packages: clean.submission.packageCount,
          dependencyEdges: clean.submission.dependencyEdgeCount,
          exposure: clean.exposure,
          timing: clean.timing,
        },
        repeatedSubmissionNodeCount: submissionCount.rows[0]?.[0]?.value,
      },
      null,
      2,
    ),
  );
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
