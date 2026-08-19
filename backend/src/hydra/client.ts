import { env } from "../config/env.js";

export type HydraScalar = string | number | boolean | null;
export type HydraParameter =
  | HydraScalar
  | HydraParameter[]
  | { [key: string]: HydraParameter };

export type HydraParameters = Record<string, HydraParameter>;
export type HydraConsistency = "causal" | "strong";

export interface HydraQueryValue<T = unknown> {
  type: string;
  value?: T;
}

export interface HydraQueryResponse {
  query_id: string;
  columns: string[];
  rows: HydraQueryValue[][];
  read_epoch: number | null;
  next_cursor: number | null;
  bookmark: string | null;
}

export interface RunQueryOptions {
  consistency?: HydraConsistency;
  timeoutMs?: number;
  bookmark?: string;
  pageSize?: number;
}

interface HydraErrorDetails {
  code?: string;
  message?: string;
}

interface HydraErrorBody extends HydraErrorDetails {
  error?: HydraErrorDetails;
}

export class HydraQueryError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HydraQueryError";
    this.status = status;
    this.code = code;
  }
}

export async function runQuery(
  query: string,
  parameters: HydraParameters = {},
  options: RunQueryOptions = {},
): Promise<HydraQueryResponse> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const response = await fetch(
    `${env.hydraHttpUrl}/v1/graphs/${encodeURIComponent(env.hydraGraphId)}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.hydraAuthToken}`,
        "Content-Type": "application/json",
        "X-Graph-Namespace": env.hydraNamespace,
      },
      body: JSON.stringify({
        cell_id: env.hydraCellId,
        query,
        parameters,
        consistency: options.consistency ?? "causal",
        ...(options.bookmark ? { bookmark: options.bookmark } : {}),
        ...(options.pageSize ? { page_size: options.pageSize } : {}),
        timeout_ms: timeoutMs,
      }),
      signal: AbortSignal.timeout(timeoutMs + 1_000),
    },
  );

  if (!response.ok) {
    let body: HydraErrorBody = {};
    try {
      body = (await response.json()) as HydraErrorBody;
    } catch {
      // Preserve the HTTP status when HydraDB does not return a JSON error body.
    }
    const details = body.error ?? body;
    throw new HydraQueryError(
      details.message ?? `HydraDB query failed with HTTP ${response.status}`,
      response.status,
      details.code,
    );
  }

  return (await response.json()) as HydraQueryResponse;
}
