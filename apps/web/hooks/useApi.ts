import { useEffect, useState } from "react";

// ─── TYPES ───
export interface ApiResult<T> {
  data: T;
  isLoading: boolean;
}

// Seeds with `fallback` for an instant first paint, swaps in the real
// response once `url` resolves. `isLoading` is what lets a consumer show a
// spinner instead of reading the fallback as "genuinely empty" - without
// it, an empty list and a list still in flight are indistinguishable.
export function useApi<T>(url: string, fallback: T): ApiResult<T> {
  const [data, setData] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
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
