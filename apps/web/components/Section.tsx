import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function Section({ title, aside, children }: SectionProps) {
  return (
    <section className="rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          {title}
        </span>
        {aside}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}