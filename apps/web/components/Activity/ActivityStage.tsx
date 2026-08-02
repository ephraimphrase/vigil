import moment from "moment";
import { STAGE_COLOR } from "@/shared/activity";
import type { ExecutionStage } from "@/types";

export function ActivityStage({ stage }: { stage: ExecutionStage }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: STAGE_COLOR[stage.status] }} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-body">{stage.label}</span>
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: STAGE_COLOR[stage.status] }}>
            {stage.status}
          </span>
          {stage.ts && <span className="font-mono text-xs text-muted/50">{moment(stage.ts).fromNow()}</span>}
        </div>
        <p className="text-sm text-muted">{stage.detail}</p>
      </div>
    </li>
  );
}
