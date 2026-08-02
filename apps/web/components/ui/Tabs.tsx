// Mono-uppercase tab strip with a violet underline indicator - the pattern
// DepositWithdraw originated (deposit/withdraw switch), now shared with the
// vault detail page's section tabs and its Performance sub-tabs. `fullWidth`
// stretches tabs into equal columns (the 2-tab deposit/withdraw switch);
// without it, tabs sit left-aligned and only take the width they need.
interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  fullWidth?: boolean;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, fullWidth, className = "" }: TabsProps<T>) {
  return (
    <div
      className={`border-b border-hairline ${fullWidth ? "grid" : "flex items-center gap-5"} ${className}`}
      style={fullWidth ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
            active === t.id ? "text-body" : "text-muted/60 hover:text-muted"
          }`}
        >
          {active === t.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-violet" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}
