import { useCallback, useState } from "react";

import { analyzeLockfile } from "../lib/api";
import type { AnalyzeResponse } from "../lib/types";

export function useAnalyze() {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(async (lockfile: string, sourceLabel?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyzeLockfile(lockfile, sourceLabel);
      setData(response);
      requestAnimationFrame(() => document.querySelector("#results")?.scrollIntoView());
      return response;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis failed");
      throw reason;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, analyze };
}
