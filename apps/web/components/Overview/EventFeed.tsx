

import moment from "moment";
import { PiPulseLight } from "react-icons/pi";
import { useEventStream } from "../../hooks/useOverview";
import { Loader } from "../ui/Loader";
import { EmptyState } from "../EmptyState";
import { KIND_COLOR } from "../../shared/activity";
import type { FeedEvent } from "../../types";

// ─── COMPONENTS ───
function Row({ e }: { e: FeedEvent }) {
  return (
    <li className="flex gap-3 px-4 py-2.5">
      <span className="mt-1 h-full min-h-[1.5rem] w-0.5 shrink-0" style={{ backgroundColor: KIND_COLOR[e.kind] }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm text-body">{e.message}</span>
          <span className="shrink-0 font-mono text-xs text-muted/50">{moment(e.ts).fromNow(true)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted/60">
          <span className="uppercase tracking-wider" style={{ color: KIND_COLOR[e.kind] }}>{e.kind}</span>
          {e.score != null && <span>· score {e.score}</span>}
          {e.txHash && <span className="text-violet-bright">· {e.txHash} {"\u2197"}</span>}
        </div>
      </div>
    </li>
  );
}

// ─── MAIN ───
export function EventFeed({ initial, isLoading = false }: { initial: FeedEvent[]; isLoading?: boolean }) {
  const events = useEventStream(initial);
  return (
    <section className="flex h-full flex-col rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet" />
          </span>
          Live activity
        </span>
      </header>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : events.length === 0 ? (
        <EmptyState query="" label="activity" icon={PiPulseLight} message="Nothing's happened yet — events appear here as cycles run." />
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-hairline/40 overflow-y-auto">
          {events.map((e) => <Row key={e.id} e={e} />)}
        </ul>
      )}
    </section>
  );
}
