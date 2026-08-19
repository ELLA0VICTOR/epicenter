import { useEffect, useState } from "react";

import { getIncidentReplay } from "../lib/api";
import type { ReplayEvent } from "../lib/types";

interface ReplayResult {
  incidentId: string;
  events: ReplayEvent[];
}

export function useIncidentReplay(incidentId: string) {
  const [data, setData] = useState<ReplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;
    let active = true;
    getIncidentReplay(incidentId)
      .then((events) => {
        if (!active) return;
        setData({ incidentId, events });
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Unable to load replay",
        );
      });
    return () => {
      active = false;
    };
  }, [incidentId]);

  return {
    data: data?.incidentId === incidentId ? data : null,
    error,
    isLoading: data?.incidentId !== incidentId && !error,
  };
}
