import { useEffect, useState } from "react";

import { getTyposquats } from "../lib/api";
import type { TyposquatResponse } from "../lib/types";

export function useTyposquats(packageName: string) {
  const [data, setData] = useState<TyposquatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTyposquats(packageName)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Unable to load matches",
        );
      });
    return () => {
      active = false;
    };
  }, [packageName]);

  return { data, error, isLoading: data?.packageName !== packageName && !error };
}
