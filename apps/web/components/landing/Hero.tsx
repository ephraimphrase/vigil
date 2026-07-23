import Image from "next/image";
import { Button } from "../ui/Button";
import { LiveTicker } from "./LiveTicker";

// ─── TYPES ─────────────────────────────────────
interface Stat {
  n: string;
  l: string;
}

// ─── CONSTANTS ─────────────────────────────────────
const STATS: Stat[] = [
  { n: "1,240+", l: "Protocols monitored" },
  { n: "<60s", l: "Signal → executed transaction" },
  { n: "100%", l: "Actions logged onchain" },
];

// ─── COMPONENT ─────────────────────────────────────
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-16 sm:pb-32 sm:pt-24">
      <Image
        src="/bg.svg"
        alt=""
        aria-hidden="true"
        fill
        priority
        className="pointer-events-none -z-10 object-cover"
      />
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        {/* copy+illustration share this positioning context, kept separate
            from the stat row below so vertical centering the (desktop-only)
            absolutely-positioned image doesn't reach past this row. */}
        <div className="relative">
          {/* ── copy, CTAs, live ticker ──
              text sits above the image (z-10) so the headline can overlap
              it once the image is absolutely positioned at lg+. Anchoring
              the image by `left` (below) in the same coordinate space as
              this column — rather than `right` — keeps the overlap amount
              constant as the container grows with viewport width. */}
          <div className="relative z-10 lg:max-w-[620px]">
            <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" />
              Protocol risk infrastructure
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl">
              Nothing slips past
              <br />
              <span className="bg-gradient-to-r from-violet-bright to-violet bg-clip-text text-transparent">
                Vigil.
              </span>
            </h1>

            <p className="mb-8 mt-5 max-w-[480px] text-lg text-text-muted">
              An autonomous agent that scores DeFi protocol health in real time and
              rebalances your positions before risk becomes loss — no alerts to miss,
              no trades to make yourself.
            </p>

            <div className="mb-11 flex flex-wrap gap-3.5">
              <Button href="#">Connect Wallet →</Button>
              <Button href="#pipeline" variant="ghost">
                See how it works
              </Button>
            </div>

{/*             <LiveTicker />
 */}          </div>

          {/* ── hero illustration ──
              normal flow (stacked below the copy, centered) up through
              tablet; at lg it's pulled out of flow, vertically centered
              against the copy column, and left-anchored so the headline's
              widest line ("Nothing slips") overlaps its left edge. */}
          <div className="relative z-0 mt-12 flex justify-center lg:absolute lg:inset-y-0 lg:left-[470px] lg:mt-0 lg:block lg:w-[540px]">
            <Image
              src="/hero.svg"
              alt=""
              aria-hidden="true"
              width={431}
              height={395}
              priority
              className="pointer-events-none h-auto w-[240px] sm:w-[400px] md:w-[440px] lg:absolute lg:left-0 lg:top-1/2 lg:w-full lg:-translate-y-1/2"
            />
          </div>
        </div>

        {/* ── stat row ── */}
       {/* ── stat row ── */}
       <div className="relative mt-24 grid grid-cols-1 divide-y divide-[#CAC0D5]/20 border border-[#CAC0D5]/20  sm:grid-cols-3 sm:divide-x sm:divide-y-0">
  {/* corner nodes — only at the four true corners of the merged frame */}
  <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
  <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
  <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
  <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />

  {STATS.map((s) => (
    <div key={s.l} className="px-6 py-5">
      <div className="font-mono text-2xl font-bold text-violet-bright">{s.n}</div>
      <div className="mt-1 text-sm text-text-muted">{s.l}</div>
    </div>
  ))}
</div>
      </div>
    </section>
  );
}