export function EmptyState({ query, label = "protocols" }: { query: string; label?: string }) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
          No {label}
        </span>
        <span className="text-sm text-text-muted/60">
          {query ? `Nothing matches "${query}".` : "Nothing to monitor yet."}
        </span>
      </div>
    );
  }