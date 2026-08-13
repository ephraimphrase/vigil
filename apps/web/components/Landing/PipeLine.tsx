import { MdKeyboardDoubleArrowDown } from "react-icons/md";

// ─── TYPES ─────────────────────────────────────
interface FlowNode {
    title: string;
    desc: string;
  }
  
  // ─── CONSTANTS ─────────────────────────────────────
  const FLOW: FlowNode[] = [
    {
      title: "Onchain + offchain signals",
      desc: "TVL, whale activity, GitHub activity, sentiment, and security news, ingested continuously.",
    },
    {
      title: "Signal aggregator",
      desc: "Normalized to a 0–1 scale per protocol, per signal.",
    },
    {
      title: "AI health scoring",
      desc: "Synthesized into a 0–100 score with written reasoning.",
    },
    {
      title: "Decision engine",
      desc: "Score against thresholds → hold, reduce, or exit instruction.",
    },
    {
      title: "KeeperHub execution",
      desc: "Gas estimation, MEV protection, and an onchain audit trail, all automatic.",
    },
  ];
  
  // ─── COMPONENT ─────────────────────────────────────
  export function Pipeline() {
    return (
      <section id="pipeline" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="grid gap-16 md:grid-cols-[0.9fr_1.1fr]">
            {/* ── explanatory copy ── */}
            <div>
              <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
                <span className="h-1.5 w-1.5 rounded-full bg-violet" />
                The pipeline
              </div>
              <h2 className="mb-5 font-display text-3xl font-bold sm:text-4xl">
                From noise to a number
                <br />
                to an action.
              </h2>
              <p className="mb-4 max-w-[440px] text-text-muted">
                Vigil pulls signals other tools treat as separate feeds (onchain data
                and offchain chatter) into one continuously-updating picture. An LLM
                turns that picture into a single health score with reasoning attached,
                and a decision engine acts on it the moment a threshold is crossed.
              </p>
              <p className="max-w-[440px] text-text-muted">
                No dashboard to refresh, no alert to catch in time. By the time you&apos;d
                have noticed, Vigil already has.
              </p>
            </div>
  
            {/* ── vertical flow diagram ── */}
            <div className="relative pl-14">
              <MdKeyboardDoubleArrowDown className="absolute left-[11px] top-0 h-3.5 w-3.5 -translate-x-1/2 text-violet" />
              <div className="absolute bottom-[14px] left-[10px] top-[14px] w-[2px] bg-gradient-to-b from-violet to-violet/0" />
              <MdKeyboardDoubleArrowDown className="absolute bottom-0 left-[11px] h-3.5 w-3.5 -translate-x-1/2 text-violet" />
              {FLOW.map((node) => (
                <div
                  key={node.title}
                  className="pipeline-node relative mb-7 bg-gradient-to-br from-[#B481CD]/20 to-[#C0ABDE]/0 px-5 py-4 rounded-lg"
                >
                  <span className="absolute -left-[45px] top-[25px] h-px w-[45px] bg-violet/50" />
                  <span className="absolute -left-[50px] top-5 h-2.5 w-2.5 rounded-full bg-violet shadow-[0_0_3.76px_0_var(--color-violet)]" />
                  <div className="font-semibold">{node.title}</div>
                  <div className="mt-0.5 text-sm text-text-muted">{node.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }