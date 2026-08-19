import type { DepsDevSystem } from "./depsDevClient.js";

export type Ecosystem = "npm" | "pypi" | "go";

export interface IncidentDefinition {
  id: string;
  name: string;
  disclosedAt: string;
  description: string;
  sourceUrl: string;
  compromiseCutoff: string;
}

export interface CampaignPackageDefinition {
  ecosystem: Ecosystem;
  depsDevSystem: DepsDevSystem;
  name: string;
  incidentId: string;
  compromisedVersions: string[];
  cleanVersion?: string;
  reportedPublishedAt?: Record<string, string>;
  reportedTimestampPrecision?: "day" | "minute";
  sourceUrl: string;
}

export const INCIDENTS: IncidentDefinition[] = [
  {
    id: "teampcp-trivy-2026-03-19",
    name: "TeamPCP Trivy compromise",
    disclosedAt: "2026-03-19T17:43:00Z",
    compromiseCutoff: "2026-03-19T17:43:00Z",
    description:
      "Compromised Aqua credentials published a malicious Trivy binary and redirected GitHub Action tags.",
    sourceUrl:
      "https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/",
  },
  {
    id: "teampcp-litellm-2026-03-24",
    name: "TeamPCP LiteLLM PyPI compromise",
    disclosedAt: "2026-03-24T00:00:00Z",
    compromiseCutoff: "2026-03-24T00:00:00Z",
    description:
      "Two malicious LiteLLM releases harvested credentials, installed persistence, and attempted Kubernetes propagation.",
    sourceUrl:
      "https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/",
  },
  {
    id: "teampcp-bitwarden-2026-04-22",
    name: "TeamPCP Bitwarden CLI compromise",
    disclosedAt: "2026-04-22T21:22:59.021Z",
    compromiseCutoff: "2026-04-22T21:22:59.021Z",
    description:
      "A malicious Bitwarden CLI release stole cloud and developer credentials and attempted npm propagation.",
    sourceUrl:
      "https://www.paloaltonetworks.com/blog/cloud-security/bitwardencli-supply-chain-attack/",
  },
  {
    id: "teampcp-sap-2026-04-29",
    name: "TeamPCP-linked SAP npm compromise",
    disclosedAt: "2026-04-29T00:00:00Z",
    compromiseCutoff: "2026-04-29T00:00:00Z",
    description:
      "Four SAP CAP and Cloud MTA packages gained a malicious preinstall credential stealer.",
    sourceUrl:
      "https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack",
  },
  {
    id: "teampcp-lightning-2026-04-30",
    name: "PyTorch Lightning PyPI compromise",
    disclosedAt: "2026-04-30T12:45:20Z",
    compromiseCutoff: "2026-04-30T12:45:20Z",
    description:
      "Two PyPI builds of Lightning executed a credential-harvesting payload on import.",
    sourceUrl:
      "https://lightning.ai/blog/pytorch-lightning-supply-chain-attack",
  },
  {
    id: "teampcp-tanstack-2026-05-11",
    name: "TanStack npm supply-chain compromise",
    disclosedAt: "2026-05-11T19:20:39Z",
    compromiseCutoff: "2026-05-11T19:20:39Z",
    description:
      "A poisoned GitHub Actions cache led to 84 malicious releases across 42 TanStack Router/Start packages.",
    sourceUrl:
      "https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx",
  },
];

const TANSTACK_SOURCE =
  "https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx";

const TANSTACK_PACKAGES: Array<[string, string, string]> = [
  ["@tanstack/arktype-adapter", "1.166.12", "1.166.15"],
  ["@tanstack/eslint-plugin-router", "1.161.9", "1.161.12"],
  ["@tanstack/eslint-plugin-start", "0.0.4", "0.0.7"],
  ["@tanstack/history", "1.161.9", "1.161.12"],
  ["@tanstack/nitro-v2-vite-plugin", "1.154.12", "1.154.15"],
  ["@tanstack/react-router", "1.169.5", "1.169.8"],
  ["@tanstack/react-router-devtools", "1.166.16", "1.166.19"],
  ["@tanstack/react-router-ssr-query", "1.166.15", "1.166.18"],
  ["@tanstack/react-start", "1.167.68", "1.167.71"],
  ["@tanstack/react-start-client", "1.166.51", "1.166.54"],
  ["@tanstack/react-start-rsc", "0.0.47", "0.0.50"],
  ["@tanstack/react-start-server", "1.166.55", "1.166.58"],
  ["@tanstack/router-cli", "1.166.46", "1.166.49"],
  ["@tanstack/router-core", "1.169.5", "1.169.8"],
  ["@tanstack/router-devtools", "1.166.16", "1.166.19"],
  ["@tanstack/router-devtools-core", "1.167.6", "1.167.9"],
  ["@tanstack/router-generator", "1.166.45", "1.166.48"],
  ["@tanstack/router-plugin", "1.167.38", "1.167.41"],
  ["@tanstack/router-ssr-query-core", "1.168.3", "1.168.6"],
  ["@tanstack/router-utils", "1.161.11", "1.161.14"],
  ["@tanstack/router-vite-plugin", "1.166.53", "1.166.56"],
  ["@tanstack/solid-router", "1.169.5", "1.169.8"],
  ["@tanstack/solid-router-devtools", "1.166.16", "1.166.19"],
  ["@tanstack/solid-router-ssr-query", "1.166.15", "1.166.18"],
  ["@tanstack/solid-start", "1.167.65", "1.167.68"],
  ["@tanstack/solid-start-client", "1.166.50", "1.166.53"],
  ["@tanstack/solid-start-server", "1.166.54", "1.166.57"],
  ["@tanstack/start-client-core", "1.168.5", "1.168.8"],
  ["@tanstack/start-fn-stubs", "1.161.9", "1.161.12"],
  ["@tanstack/start-plugin-core", "1.169.23", "1.169.26"],
  ["@tanstack/start-server-core", "1.167.33", "1.167.36"],
  ["@tanstack/start-static-server-functions", "1.166.44", "1.166.47"],
  ["@tanstack/start-storage-context", "1.166.38", "1.166.41"],
  ["@tanstack/valibot-adapter", "1.166.12", "1.166.15"],
  ["@tanstack/virtual-file-routes", "1.161.10", "1.161.13"],
  ["@tanstack/vue-router", "1.169.5", "1.169.8"],
  ["@tanstack/vue-router-devtools", "1.166.16", "1.166.19"],
  ["@tanstack/vue-router-ssr-query", "1.166.15", "1.166.18"],
  ["@tanstack/vue-start", "1.167.61", "1.167.64"],
  ["@tanstack/vue-start-client", "1.166.46", "1.166.49"],
  ["@tanstack/vue-start-server", "1.166.50", "1.166.53"],
  ["@tanstack/zod-adapter", "1.166.12", "1.166.15"],
];

export const CAMPAIGN_PACKAGES: CampaignPackageDefinition[] = [
  ...TANSTACK_PACKAGES.map(([name, first, second]) => ({
    ecosystem: "npm" as const,
    depsDevSystem: "NPM" as const,
    name,
    incidentId: "teampcp-tanstack-2026-05-11",
    compromisedVersions: [first, second],
    sourceUrl: TANSTACK_SOURCE,
  })),
  {
    ecosystem: "go",
    depsDevSystem: "GO",
    name: "github.com/aquasecurity/trivy",
    incidentId: "teampcp-trivy-2026-03-19",
    compromisedVersions: ["v0.69.4"],
    cleanVersion: "v0.69.3",
    reportedPublishedAt: { "v0.69.4": "2026-03-19T17:43:00Z" },
    reportedTimestampPrecision: "minute",
    sourceUrl:
      "https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know/",
  },
  {
    ecosystem: "pypi",
    depsDevSystem: "PYPI",
    name: "litellm",
    incidentId: "teampcp-litellm-2026-03-24",
    compromisedVersions: ["1.82.7", "1.82.8"],
    cleanVersion: "1.82.6",
    reportedPublishedAt: {
      "1.82.7": "2026-03-24T00:00:00Z",
      "1.82.8": "2026-03-24T00:00:00Z",
    },
    reportedTimestampPrecision: "day",
    sourceUrl:
      "https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/",
  },
  {
    ecosystem: "npm",
    depsDevSystem: "NPM",
    name: "mbt",
    incidentId: "teampcp-sap-2026-04-29",
    compromisedVersions: ["1.2.48"],
    sourceUrl: "https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack",
  },
  {
    ecosystem: "npm",
    depsDevSystem: "NPM",
    name: "@cap-js/db-service",
    incidentId: "teampcp-sap-2026-04-29",
    compromisedVersions: ["2.10.1"],
    sourceUrl: "https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack",
  },
  {
    ecosystem: "npm",
    depsDevSystem: "NPM",
    name: "@cap-js/postgres",
    incidentId: "teampcp-sap-2026-04-29",
    compromisedVersions: ["2.2.2"],
    sourceUrl: "https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack",
  },
  {
    ecosystem: "npm",
    depsDevSystem: "NPM",
    name: "@cap-js/sqlite",
    incidentId: "teampcp-sap-2026-04-29",
    compromisedVersions: ["2.2.2"],
    sourceUrl: "https://socket.dev/blog/sap-cap-npm-packages-supply-chain-attack",
  },
  {
    ecosystem: "npm",
    depsDevSystem: "NPM",
    name: "@bitwarden/cli",
    incidentId: "teampcp-bitwarden-2026-04-22",
    compromisedVersions: ["2026.4.0"],
    sourceUrl:
      "https://www.paloaltonetworks.com/blog/cloud-security/bitwardencli-supply-chain-attack/",
  },
  {
    ecosystem: "pypi",
    depsDevSystem: "PYPI",
    name: "lightning",
    incidentId: "teampcp-lightning-2026-04-30",
    compromisedVersions: ["2.6.2", "2.6.3"],
    cleanVersion: "2.6.1",
    reportedPublishedAt: {
      "2.6.2": "2026-04-30T00:00:00Z",
      "2.6.3": "2026-04-30T00:00:00Z",
    },
    reportedTimestampPrecision: "day",
    sourceUrl: "https://lightning.ai/blog/pytorch-lightning-supply-chain-attack",
  },
];

if (TANSTACK_PACKAGES.length !== 42) {
  throw new Error(`Expected 42 TanStack packages, found ${TANSTACK_PACKAGES.length}`);
}

const tanStackVersionCount = TANSTACK_PACKAGES.reduce(
  (total, entry) => total + entry.slice(1).length,
  0,
);
if (tanStackVersionCount !== 84) {
  throw new Error(
    `Expected 84 TanStack compromised versions, found ${tanStackVersionCount}`,
  );
}
