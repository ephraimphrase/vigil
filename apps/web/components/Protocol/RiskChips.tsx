const MAX_VISIBLE = 2;

export function RiskChips({ flags }: { flags: string[] }) {
  if (flags.length === 0) {
    return <span className="font-mono text-xs text-text-muted/50">{"\u2014"}</span>;
  }
  const shown = flags.slice(0, MAX_VISIBLE);
  const overflow = flags.length - shown.length;
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((f) => (
        <span
          key={f}
          className="glass-pill whitespace-nowrap rounded-full px-2 py-0.5 text-xs text-text-muted"
        >
          {f}
        </span>
      ))}
      {overflow > 0 && (
        <span className="font-mono text-xs text-text-muted/60">+{overflow}</span>
      )}
    </div>
  );
}