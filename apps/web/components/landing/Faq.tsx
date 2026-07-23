"use client";

import { useState } from "react";

// ─── TYPES ─────────────────────────────────────
interface FaqEntry {
  q: string;
  a: string;
}

// ─── CONSTANTS ─────────────────────────────────────
const FAQS: FaqEntry[] = [
  {
    q: "Is Vigil a trading bot?",
    a: "No. Vigil doesn't chase yield or make speculative calls — it only acts to reduce risk when a protocol's health score drops.",
  },
  {
    q: "How fast does it react?",
    a: "Signal to executed transaction in under 60 seconds, with no human approval step in between.",
  },
  {
    q: "Does Vigil custody my funds?",
    a: "No. Every action executes directly from your positions through KeeperHub's onchain layer — Vigil never holds your assets.",
  },
  {
    q: "Can I override a decision?",
    a: "Yes. Thresholds and auto-execution can be adjusted or paused per protocol at any time.",
  },
  {
    q: "What if a protocol's score recovers?",
    a: "Vigil re-enters using the same thresholds in reverse, logged the same way as any other action.",
  },
];

// ─── COMPONENT ─────────────────────────────────────
export function FAQ() {
  // ── index of the currently expanded entry, or null if all closed ──
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          Good to know
        </div>
        <h2 className="mb-6 font-display text-3xl font-bold sm:text-4xl">
          Questions worth asking first.
        </h2>

        <div>
          {FAQS.map((entry, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={entry.q} className="border-b border-border">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left font-bold"
                >
                  <span>{entry.q}</span>
                  <span
                    className={`font-mono text-lg text-violet-bright transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ${
                    isOpen ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="max-w-xl pb-5 text-sm text-text-muted">{entry.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}