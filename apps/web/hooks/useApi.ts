import { useEffect, useRef, useState } from "react";

// ─── TYPES ───
export interface ApiResult<T> {
  data: T;
  isLoading: boolean;
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
export function useApi<T>(url: string, fallback: T): ApiResult<T> {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setData(fallbackRef.current);
    (async () => {
      const res = await fetch(url);
      if (cancelled) return;
      if (res.ok) setData(await res.json());
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [url]);
  return { data, isLoading };
}
