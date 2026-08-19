import type {
  AnalyzeResponse,
  IncidentsResponse,
  MaintainerOverlapResponse,
  TyposquatResponse,
} from "./types";

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Request failed with HTTP ${response.status}`;
    throw new Error(
      message,
    );
  }
  return body as T;
}

export const getIncidents = (): Promise<IncidentsResponse> =>
  requestJson<IncidentsResponse>("/api/incidents");

export const analyzeLockfile = (
  lockfile: string,
  sourceLabel?: string,
): Promise<AnalyzeResponse> =>
  requestJson<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lockfile, ...(sourceLabel ? { sourceLabel } : {}) }),
  });

export const getMaintainerOverlap = (
  incidentId: string,
): Promise<MaintainerOverlapResponse> =>
  requestJson<MaintainerOverlapResponse>(
    `/api/maintainer-overlap?incidentId=${encodeURIComponent(incidentId)}`,
  );

export const getTyposquats = (packageName: string): Promise<TyposquatResponse> =>
  requestJson<TyposquatResponse>(
    `/api/typosquats?packageName=${encodeURIComponent(packageName)}`,
  );
