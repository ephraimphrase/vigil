

interface KillSwitchProps {
  armed: boolean;             
  onToggle: () => void;
}

export function KillSwitch({ armed, onToggle }: KillSwitchProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={armed}
      className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted outline-none focus-visible:ring-1 focus-visible:ring-violet"
    >
      <span className="relative h-4 w-7 rounded-full border border-hairline transition-colors">
        <span
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full transition-all"
          style={{
            left: armed ? "0.875rem" : "0.125rem",
            backgroundColor: armed ? "#5FD08A" : "#E0607F",
            boxShadow: armed ? "0 0 4px #5FD08A" : "none",
          }}
        />
      </span>
      <span className={armed ? "text-body" : "text-muted"}>{armed ? "Auto on" : "Auto off"}</span>
    </button>
  );
}
