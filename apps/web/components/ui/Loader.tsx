// Adapted from a 3-bar scale spinner: same stagger/shape, restyled to
// tokens (violet, not white - DESIGN.md §8) and sharp-edged (rounded-none,
// not the pill ends of the original - DESIGN.md §5 rations rounding to
// buttons/chips). Fills the abrupt gap between "no data yet" and "here's
// the list" so a still-loading table/detail view doesn't flash empty or
// not-found first.
export function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[5px] ${className}`} role="status" aria-label="Loading">
      <span className="h-5 w-[3px] animate-bar-scale bg-violet/30" />
      <span className="h-[35px] w-[3px] animate-bar-scale bg-violet/30 [animation-delay:0.25s]" />
      <span className="h-5 w-[3px] animate-bar-scale bg-violet/30 [animation-delay:0.5s]" />
    </div>
  );
}
