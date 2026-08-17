import { useCallback, useEffect, useRef, useState } from "react";

// ─── TYPES ───
export interface ApiResult<T> {
  data: T;
  isLoading: boolean;
  /** Re-runs the fetch against the current url without resetting `data` to `fallback` first - unlike the url-change effect below, a manual/periodic refetch shouldn't flash the page back to its loading state. */
  refetch: () => void;
}

export function useApi<T>(url: string, fallback: T, refetchIntervalMs?: number, enabled = true): ApiResult<T> {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(enabled);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const loadRef = useRef<(showLoading: boolean) => void>(() => {});

  useEffect(() => {
    if (!enabled) {
      setData(fallbackRef.current);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async (showLoading: boolean) => {
      if (showLoading) setIsLoading(true);
      const res = await fetch(url);
      if (cancelled) return;
      if (res.ok) setData(await res.json());
      if (showLoading) setIsLoading(false);
    };
    loadRef.current = (showLoading) => { load(showLoading); };

    setData(fallbackRef.current);
    load(true);

    return () => { cancelled = true; };
  }, [url, enabled]);

  useEffect(() => {
    if (!refetchIntervalMs || !enabled) return;
    const interval = setInterval(() => loadRef.current(false), refetchIntervalMs);
    return () => clearInterval(interval);
  }, [refetchIntervalMs, enabled]);

  const refetch = useCallback(() => loadRef.current(false), []);

  return { data, isLoading, refetch };
}
