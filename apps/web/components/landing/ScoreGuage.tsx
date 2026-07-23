"use client";

import { useEffect, useRef } from "react";

// ─── TYPES ─────────────────────────────────────
interface ScoreGaugeProps {
  score: number; // 0–100
  status: string;
  txHash: string;
}

// ─── CONSTANTS ─────────────────────────────────────
const ARC_LENGTH = 314; // stroke-dasharray for the full semicircle path

// ─── COMPONENT ─────────────────────────────────────
export function ScoreGauge({ score, status, txHash }: ScoreGaugeProps) {
  const arcRef = useRef<SVGPathElement>(null);

  // ── sweep the arc from empty to the target score on mount ──
  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    const target = ARC_LENGTH - (score / 100) * ARC_LENGTH;
    arc.style.strokeDashoffset = `${ARC_LENGTH}`;
    requestAnimationFrame(() => {
      arc.style.transition = "stroke-dashoffset 1.4s ease";
      arc.style.strokeDashoffset = `${target}`;
    });
  }, [score]);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-border-strong bg-surface p-7 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_70%_0%,rgba(176,108,225,0.22),transparent_60%)]">
      <div className="relative mb-4 font-mono text-xs uppercase tracking-widest text-text-dim">
        Live · Protocol health score
      </div>

      <div className="relative flex justify-center">
        <svg width="240" height="150" viewBox="0 0 240 150">
          <path
            d="M20,140 A100,100 0 0,1 220,140"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            ref={arcRef}
            d="M20,140 A100,100 0 0,1 220,140"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="font-mono text-4xl font-bold text-danger">{score}</div>
          <div className="mt-0.5 font-mono text-xs uppercase tracking-wide text-text-muted">
            {status}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex justify-between gap-2.5 border-t border-border pt-4 font-mono text-xs text-text-muted">
        <span>Rebalance executed via KeeperHub</span>
        <span className="font-semibold text-healthy">{txHash} ✓</span>
      </div>
    </div>
  );
}