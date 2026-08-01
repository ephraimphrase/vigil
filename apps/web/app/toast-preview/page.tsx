"use client";

import { toast } from "@/components/ui/Toast";

export default function ToastPreviewPage() {
  return (
    <div className="flex min-h-screen flex-col items-start gap-3 bg-bg p-10">
      <button
        className="border border-hairline px-4 py-2 text-sm text-body"
        onClick={() =>
          toast.success("Position reduced 25%", { description: "Aave v3 health score dropped below 70." })
        }
      >
        Fire success
      </button>
      <button
        className="border border-hairline px-4 py-2 text-sm text-body"
        onClick={() => toast.warning("Health score degrading", { description: "Compound c-USDC is at 58." })}
      >
        Fire warning
      </button>
      <button
        className="border border-hairline px-4 py-2 text-sm text-body"
        onClick={() => toast.error("Full exit triggered", { description: "Curve 3pool score fell below 40." })}
      >
        Fire error
      </button>
      <button
        className="border border-hairline px-4 py-2 text-sm text-body"
        onClick={() => toast.info("Watchlist synced")}
      >
        Fire info
      </button>
      <button
        className="border border-hairline px-4 py-2 text-sm text-body"
        onClick={() => {
          toast.success("Toast one");
          toast.warning("Toast two");
          toast.error("Toast three");
        }}
      >
        Fire stack
      </button>
    </div>
  );
}
