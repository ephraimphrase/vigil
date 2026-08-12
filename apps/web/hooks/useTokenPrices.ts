"use client";

// ─────────────────────────────────────────────────────────────
// useTokenPrices — polls /api/token-prices (server-cached, 60s TTL - see
// that route) so open pages track live prices without a manual refresh,
// instead of the plain fetch-once-per-mount useApi gives every other hook.
// One shared address -> USD map; callers key into it themselves.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

const REFRESH_MS = 60_000;

export function useTokenPrices(): { prices: Record<string, number | null>; isLoading: boolean } {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/token-prices");
        if (cancelled) return;
        if (res.ok) setPrices(await res.json());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { prices, isLoading };
}
