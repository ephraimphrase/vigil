export function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[5px] ${className}`} role="status" aria-label="Loading">
      <span className="h-5 w-[3px] animate-bar-scale bg-violet/30" />
      <span className="h-[35px] w-[3px] animate-bar-scale bg-violet/30 [animation-delay:0.25s]" />
      <span className="h-5 w-[3px] animate-bar-scale bg-violet/30 [animation-delay:0.5s]" />
    </div>
  );
}
