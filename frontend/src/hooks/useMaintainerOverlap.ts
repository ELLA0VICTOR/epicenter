import { useEffect, useState } from "react";

import { getMaintainerOverlap } from "../lib/api";
import type { MaintainerOverlapResponse } from "../lib/types";

export function useMaintainerOverlap(incidentId: string) {
  const [data, setData] = useState<MaintainerOverlapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMaintainerOverlap(incidentId)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Unable to load overlap",
        );
      });
    return () => {
      active = false;
    };
  }, [incidentId]);

  return { data, error, isLoading: data?.incident.id !== incidentId && !error };
}
