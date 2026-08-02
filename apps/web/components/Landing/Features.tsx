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
    <section id="features" className="relative py-24 sm:py-32">
   
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 hidden w-[46vw] max-w-[820px] -translate-y-1/2 md:block"
      >
        <Image
          src="/cylinder2.svg"
          alt=""
          width={500}
          height={439}
          className="h-auto w-full"
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        {/* ⬢ Mobile-only inline orb */}
        <Image
          src="/cylinder2.svg"
          alt=""
          aria-hidden="true"
          width={500}
          height={439}
          className="pointer-events-none mx-auto mb-10 h-auto w-[260px] sm:w-[460px] md:hidden"
        />

    
        <div className="grid items-center gap-0 md:grid-cols-[60fr_40fr]">
          <div aria-hidden="true" className="hidden md:block" />

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
                  className="border-b border-border py-7 transition-[padding-left]"
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