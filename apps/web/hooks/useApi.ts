import { useEffect, useState } from "react";

// Seeds with `fallback` for an instant first paint, swaps in the real
// response once `url` resolves.
export function useApi<T>(url: string, fallback: T): T {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    (async () => {
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    })();
  }, [url]);
  return data;
}
