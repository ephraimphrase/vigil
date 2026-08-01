// ─── COMPONENT ─────────────────────────────────────
// Layered rotated, gradient-filled facets standing in for the reference
// design's 3D glass renders — pure CSS, no image assets required.
export function GlassShape() {
    return (
      <div className="relative min-h-[280px] w-full animate-float">
        <div className="absolute left-[4%] top-[6%] h-[62%] w-[62%] -rotate-[14deg] rounded-2xl border border-white/15 bg-gradient-to-br from-violet-bright/50 via-indigo/30 to-transparent shadow-[0_30px_60px_-20px_rgba(150,104,183,0.55)] backdrop-blur-[2px]" />
        <div className="absolute left-[34%] top-[32%] h-[50%] w-[50%] rotate-[18deg] rounded-2xl border border-white/15 bg-gradient-to-br from-violet/55 to-surface-2/15 shadow-[0_30px_60px_-20px_rgba(150,104,183,0.55)] backdrop-blur-[2px]" />
        <div className="absolute left-[52%] top-[12%] h-[34%] w-[34%] -rotate-[6deg] rounded-2xl border border-white/15 bg-gradient-to-br from-white/40 to-violet/20 shadow-[0_30px_60px_-20px_rgba(150,104,183,0.55)] backdrop-blur-[2px]" />
      </div>
    );
  }