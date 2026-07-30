import { GRID_COLS, ROW_HEIGHT, SKELETON_ROWS } from "../config/table.config";

interface TableSkeletonProps {
  gridCols?: string;
  cols?: number;
}

export function TableSkeleton({ gridCols = GRID_COLS, cols = 8 }: TableSkeletonProps) {
  return (
    <div>
      {Array.from({ length: SKELETON_ROWS }).map((_, r) => (
        <div
          key={r}
          className="grid items-center border-b border-[#CAC0D5]/20 px-3"
          style={{ gridTemplateColumns: gridCols, height: ROW_HEIGHT }}
        >
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="pr-4">
              <div className="h-3 w-full max-w-20 animate-pulse rounded-none bg-violet/10" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}