interface ProtocolsHeaderProps {
    visibleCount: number;
    totalCount: number;
  }
  
  export function ProtocolsHeader({ visibleCount, totalCount }: ProtocolsHeaderProps) {
    return (
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-violet" />
            Monitoring
          </span>
          <h1 className="font-display text-2xl leading-none tracking-tight text-text">
            Protocols.
          </h1>
        </div>
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {visibleCount} / {totalCount}
        </span>
      </div>
    );
  }