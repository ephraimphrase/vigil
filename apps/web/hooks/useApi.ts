import { useCallback, useEffect, useRef, useState } from "react";

// ─── TYPES ───
export interface ApiResult<T> {
  data: T;
  isLoading: boolean;
  /** Re-runs the fetch against the current url without resetting `data` to `fallback` first - unlike the url-change effect below, a manual/periodic refetch shouldn't flash the page back to its loading state. */
  refetch: () => void;
}

// Seeds with `fallback` for an instant first paint, swaps in the real
// response once `url` resolves. `isLoading` is what lets a consumer show a
// spinner instead of reading the fallback as "genuinely empty" - without
// it, an empty list and a list still in flight are indistinguishable.
// Resets to `fallback` whenever `url` itself changes (e.g. a slug-keyed
// detail page navigating conservative -> wbtc-core) so the previous url's
// data can never render under the new one while the new fetch is in
// flight - `fallbackRef` (not `fallback` itself) is read there so callers
// passing an inline literal (`useApi(url, [])`) don't refetch every render.
//
// `refetchIntervalMs` is opt-in (omit it and this behaves exactly as
// before) - pass it for data that goes stale while the page sits open
// (e.g. a vault's TVL moving as other wallets deposit/withdraw).
export function useApi<T>(url: string, fallback: T, refetchIntervalMs?: number): ApiResult<T> {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const loadRef = useRef<(showLoading: boolean) => void>(() => {});

  useEffect(() => {
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
  }, [url]);

  useEffect(() => {
    if (!refetchIntervalMs) return;
    const interval = setInterval(() => loadRef.current(false), refetchIntervalMs);
    return () => clearInterval(interval);
  }, [refetchIntervalMs]);

  const refetch = useCallback(() => loadRef.current(false), []);

  return { data, isLoading, refetch };
}
