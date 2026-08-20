# Epicenter

Trace a lockfile through the software supply chain to the exact compromised release—across every dependency hop.

Epicenter is a Hack Hydra Track 2A submission. It parses npm lockfiles, stores their resolved dependency graph in HydraDB, and checks the entire tree against a sourced TeamPCP campaign dataset in one bounded multi-source path query.

## Problem

Package security tools are good at answering whether one known version is flagged. They are less useful when the urgent question is: “Which dependency introduced this compromised artifact, and what path connects it to my application?” Names and similarity scores cannot reconstruct that route.

The May 2026 TanStack compromise demonstrated the scale of that problem: a CI compromise produced 84 malicious releases across 42 packages. Epicenter models exact versions, dependency edges, maintainers, incidents, and precomputed name similarity so those relationships remain queryable rather than flattened into isolated alerts. The incident package/version list is grounded in the [TanStack security advisory](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx) and the additional public reports listed below.

## What we built

- `package-lock.json` v2 and v3 parsing, including nested/hoisted dependency resolution.
- Idempotent lockfile ingestion with `PackageVersion`, `DEPENDS_ON`, `LockfileSubmission`, and `RESOLVED` graph records.
- A blast-radius API using a direct exact-version pass plus HydraDB `algo.MSpaths` for transitive path reconstruction.
- A force-directed exposure graph and safe/exposed result summary.
- A timestamp-backed propagation replay for all six incidents, with an animated incident-membership graph ordered by each compromised version's sourced publish time.
- Six sourced TeamPCP-related incidents containing 50 packages, 94 compromised versions, and 20 real maintainer identities.
- Incident-scoped maintainer-overlap traversal over `MAINTAINS` edges.
- A precomputed typosquat index against 2,000 ranked npm names, stored as `NAME_SIMILAR_TO {distance}` edges; names shorter than five characters are excluded to avoid noisy matches.

Current curated graph statistics:

| Entity | Count |
|---|---:|
| Campaign packages | 50 |
| Compromised versions | 94 |
| Incidents | 6 |
| Maintainers | 20 |
| Popular-name snapshot | 2,000 |
| Precomputed similarity edges | 0 after the five-character noise filter |

## How this uses HydraDB

HydraDB is Epicenter's only database and performs the product's central computation. The graph uses these labels and relationships:

```text
(:PackageVersion)-[:VERSION_OF]->(:Package)
(:PackageVersion)-[:DEPENDS_ON]->(:PackageVersion)
(:Maintainer)-[:MAINTAINS]->(:Package)
(:PackageVersion)-[:COMPROMISED_IN]->(:Incident)
(:LockfileSubmission)-[:RESOLVED]->(:PackageVersion)
(:Package)-[:NAME_SIMILAR_TO {distance}]->(:Package)
```

The core traversal sends every resolved lockfile key and every compromised target key to a single call:

```cypher
CALL algo.MSpaths({
  sourceLabel: 'PackageVersion',
  sourceProperty: 'key',
  sourceValues: [...],
  targetValues: [...],
  pairwise: false,
  relTypes: ['DEPENDS_ON'],
  relDirection: 'outgoing',
  maxLen: 8,
  pathCount: 5,
  resultLimit: 500
})
YIELD path
RETURN path
```

An exact key intersection answers direct exposure immediately; `algo.MSpaths` reconstructs and returns the transitive routes. Without HydraDB, Epicenter loses the one operation that defines the product: cross-evaluating a complete resolved tree against the compromised corpus and returning the actual multi-hop paths without client-side one-source/one-target fan-out. A vector index could suggest similar names, but it cannot preserve dependency direction, exact versions, incident membership, or maintainer connectivity.

## Tech stack

| Layer | Technology |
|---|---|
| Graph database | HydraDB `graph-node`, built from the included upstream submodule |
| Backend | Node.js, TypeScript, Express |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Graph rendering | D3 Force |
| Typography | Geist Sans, Geist Mono, and Geist Pixel (SIL OFL 1.1) |
| External metadata | npm registry API and deps.dev API |

## Setup

Requirements: Docker Desktop, Node.js 22 or newer, npm, and Git with submodule support.

For a fresh checkout, clone with the HydraDB submodule included: `git clone --recurse-submodules https://github.com/ELLA0VICTOR/epicenter.git` (or run `git submodule update --init --recursive` after a normal clone).

```bash
git submodule update --init --recursive
npm install
docker compose up --build -d
npm run schema
npm run seed
```

`npm run seed` first refreshes the sourced incident metadata, then snapshots the pinned `npm-high-impact` corpus and writes the precomputed similarity edges. It is safe to rerun: graph writes use deterministic IDs and `MERGE`.

Start the backend and frontend in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). The Vite server proxies `/api` to the backend at `http://127.0.0.1:3001`; HydraDB serves its HTTP query API at `http://127.0.0.1:8443`.

Default local configuration is documented in `.env.example` and `backend/.env.example`. Override those values with environment variables when needed.

## Deployment

The production deployment uses two public services:

- Vercel serves the static React/Vite frontend from the `frontend` root directory.
- One Render Docker web service runs the Express API and an internal HydraDB node. HydraDB is not exposed publicly.

Create the Render service from the root `render.yaml` Blueprint. The free Render plan has an ephemeral filesystem and spins down after inactivity, so `deploy/render/entrypoint.sh` rebuilds the sourced incident graph before starting the public API whenever a fresh container starts. This makes free cold starts slower but keeps the demonstration self-initializing. For durable production storage, upgrade the Render service and attach a persistent disk at `/data`.

After Render provides the API URL, configure this Vercel build variable and redeploy the frontend:

```text
VITE_API_BASE_URL=https://your-epicenter-api.onrender.com
```

For local Vite development, leave `VITE_API_BASE_URL` empty so requests continue through the local `/api` proxy.

## API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend and HydraDB liveness |
| `GET` | `/api/incidents` | Incident metadata and live graph statistics |
| `GET` | `/api/incidents/:id/replay` | Compromised versions ordered by sourced publication time for replay |
| `POST` | `/api/analyze` | Parse, ingest, and analyze a lockfile |
| `GET` | `/api/maintainer-overlap?incidentId=...` | Find packages outside an incident set reached through shared maintainers |
| `GET` | `/api/typosquats?packageName=...` | Read precomputed nearby-name edges for a seeded package |

`POST /api/analyze` accepts:

```json
{
  "lockfile": "{ ...raw package-lock.json text... }",
  "sourceLabel": "optional display label"
}
```

## Verification

```bash
npm test --workspace backend
npm run lint
npm run build:all
npm run test:e2e --workspace backend
```

The end-to-end fixtures cover both outcomes:

- Exposed: [Mini Shai-Hulud compromised npm fixture](https://github.com/champjss/mini-shai-hulud-checker-20260512/tree/main/resources/test-fixtures/packages/npm-compromised), which resolves the compromised TanStack Router versions.
- Clean/realistic scale: [Node.js Undici package-lock.json](https://github.com/nodejs/undici/blob/main/package-lock.json).

## Data sources and attribution

- [npm public registry API](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md): npm maintainers and exact version publication timestamps.
- [deps.dev API](https://docs.deps.dev/api/v3/): version and source-repository metadata for npm, PyPI, and Go packages.
- [npm-high-impact](https://github.com/wooorm/npm-high-impact), MIT licensed by Titus Wormer: ranked npm names using npm's high-impact thresholds. Epicenter pins version `1.13.0` and snapshots the first 2,000 unique names in download/dependent rank order.
- [TanStack Router advisory](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx): 42 affected packages and 84 malicious artifacts.
- [Aqua Security's Trivy report](https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/).
- [Datadog Security Labs' LiteLLM report](https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/).
- [Palo Alto Networks' Bitwarden CLI report](https://www.paloaltonetworks.com/blog/cloud-security/bitwardencli-supply-chain-attack/).
- [Socket's SAP npm report](https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack).
- [Lightning AI's PyTorch Lightning report](https://lightning.ai/blog/pytorch-lightning-supply-chain-attack).
- [Mini Shai-Hulud Checker](https://github.com/champjss/mini-shai-hulud-checker-20260512): public exposed lockfile fixture used for browser and API verification.
- [Node.js Undici](https://github.com/nodejs/undici): realistic clean lockfile used for scale and false-positive verification.

Raw evidence collected by the incident seed is retained in `backend/data/seed-evidence.json`, including the metadata URL and provenance for each maintainer and timestamp. The exact popular-name snapshot is retained in `backend/src/ingestion/popularPackages.json`.

## License

MIT — see [LICENSE](LICENSE).
