import { useEffect, useState } from "react";

import { getIncidents } from "../lib/api";
import type { IncidentsResponse } from "../lib/types";

export function useIncidents() {
  const [data, setData] = useState<IncidentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getIncidents()
      .then((response) => active && setData(response))
      .catch((reason: unknown) =>
        active && setError(reason instanceof Error ? reason.message : "Unable to load incidents"),
      );
    return () => {
      active = false;
    };
  }, []);

  return { data, error };
}
