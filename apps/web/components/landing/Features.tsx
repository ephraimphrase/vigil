import Image from "next/image";

// ─── TYPES ─────────────────────────────────────
interface Feature {
  idx: string;
  title: string;
  desc: string;
}

// ─── CONSTANTS ─────────────────────────────────────
const FEATURES: Feature[] = [
  {
    idx: "01",
    title: "Health Scoring",
    desc: "Claude synthesizes onchain and offchain signals into a 0–100 score with plain-language reasoning, refreshed continuously — not on a schedule.",
  },
  {
    idx: "02",
    title: "Autonomous Rebalancing",
    desc: "A score drop triggers a position change on its own. No push notification waiting for you to act on it.",
  },
  {
    idx: "03",
    title: "KeeperHub Execution",
    desc: "Every trade routes through gas estimation, MEV protection, and an audit trail you can verify onchain.",
  },
];

// ─── COMPONENT ─────────────────────────────────────
export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="grid items-center gap-16 md:grid-cols-[0.9fr_1.1fr]">
          <Image
            src="/cylinder.svg"
            alt=""
            aria-hidden="true"
            width={500}
            height={439}
            className="pointer-events-none mx-auto h-auto w-[220px] sm:w-[420px] md:mx-0 md:w-full"
          />

          <div>
            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" />
              What it does
            </div>
            <h2 className="mb-6 font-display text-3xl font-bold sm:text-4xl">
              Three things running
              <br />
              at all times.
            </h2>

            <div className="border-t border-border">
              {FEATURES.map((f) => (
                <div
                  key={f.idx}
                  className="border-b border-border py-7 transition-[padding-left] hover:bg-gradient-to-r hover:from-violet/[0.06] hover:to-transparent hover:pl-2.5"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold">{f.title}</h3>
                    <span className="font-mono text-sm text-text-dim">{f.idx}</span>
                  </div>
                  <p className="mt-2 max-w-[520px] text-sm text-text-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}