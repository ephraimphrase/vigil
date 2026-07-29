"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function InfoTooltip({ children, side = "top" }: { children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex cursor-help align-middle text-muted/50 outline-none transition-colors hover:text-violet-bright focus-visible:text-violet-bright"
        aria-label="More information"
      >
        <Info className="size-3" />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-64 border-hairline bg-panel">
        <p className="text-pretty font-sans text-xs leading-snug text-muted">{children}</p>
      </TooltipContent>
    </Tooltip>
  );
}
