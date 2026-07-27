export function EmptyState({ query }: { query: string }) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
          No protocols
        </span>
        <span className="text-sm text-text-muted/60">
          {query ? `Nothing matches "${query}".` : "Nothing to monitor yet."}
        </span>
      </div>
    );
  }