import Image from "next/image";
import { Button } from "../ui/Button";
import { SplineRobot } from "./SplineRobot";


interface Stat {
  n: string;
  l: string;
}

const STATS: Stat[] = [
  { n: "22+", l: "Protocols monitored" },
  { n: "<60s", l: "Signal → executed transaction" },
  { n: "100%", l: "Actions logged onchain" },
];

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

        <div className="relative grid gap-12 lg:grid-cols-[620px_1fr] lg:items-center">
          <div className="relative z-10">
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
              rebalances your positions before risk becomes loss 
            </p>

            <div className="mb-11 flex flex-wrap items-center gap-3.5">
              <Button href="/dashboard" variant="primary" icon={true} >
                Get started
              </Button>
              <Button href="/protocols" variant="ghost" className="h-[52px]">
                Monitor live protocols
              </Button>
            </div>
        </div>

          <div className="h-[110px] w-[250px] border border-[#CAC0D5]/20 rounded-none bg-[#1e1425] absolute top-[22rem] right-[1rem] z-[99999] flex items-center justify-center px-3">
      <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
      <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
      <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
      <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]" />
      <p className="bg-linear-to-b from-white to-[#55416E] to-60% bg-clip-text text-transparent">Instant notifications, adaptive controls and AI-powered fraud defense.</p>
          </div>

          <div className="relative z-0 h-75 w-full -translate-y-6 sm:h-100 lg:h-full lg:-translate-y-10">
            <SplineRobot />
          </div>
        </div>

  
       <div className="relative mt-24 grid grid-cols-1 divide-y divide-[#CAC0D5]/20 border border-[#CAC0D5]/20  sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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