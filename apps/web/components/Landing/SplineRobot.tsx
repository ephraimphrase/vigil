'use client';

// ─── IMPORTS ───
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ─── CONSTANTS ───
const SCENE_URL =
  'https://prod.spline.design/o-weaVtgyLtpV3EB/scene.splinecode';
const POSTER_SRC = '/robot-poster.webp'; // static still of the same camera angle
const IDLE_TIMEOUT_MS = 2500; // force-mount even if the main thread never idles

// ─── COMPONENTS ───
// runtime is client-only and heavy — never SSR it, never put it in the
// server bundle. dynamic() also code-splits it out of the page chunk.
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
});

export function SplineRobot() {
  // ── state ──
  const [mounted, setMounted] = useState(false); // allowed to fetch runtime
  const [loaded, setLoaded] = useState(false); // scene parsed + first frame

  // ── defer runtime past first paint ──
  // the ~2MB runtime must never compete with LCP/hydration. wait for idle,
  // with a timeout so throttled CPUs still get the scene eventually.
  useEffect(() => {
    // TS's DOM lib types requestIdleCallback as always-present on Window,
    // so `'requestIdleCallback' in window` type-narrows the fallthrough
    // to never even though it's genuinely missing at runtime in Safari -
    // check the function itself instead of the global to dodge that.
    const idle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    if (idle) {
      const id = idle(() => setMounted(true), { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setMounted(true), 300); // safari
    return () => clearTimeout(id);
  }, []);

  // ── render ──
  return (
    <div className="relative h-full w-full">
      {/* poster — paints instantly, fades out once the scene is live */}
      <Image
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        fill
        priority
        className={`pointer-events-none object-contain transition-opacity duration-700 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* scene — mounts on idle, fades in on load */}
      {mounted && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Spline scene={SCENE_URL} onLoad={() => setLoaded(true)} />
        </div>
      )}
    </div>
  );
}