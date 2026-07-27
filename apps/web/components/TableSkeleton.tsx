import { GRID_COLS, ROW_HEIGHT, SKELETON_ROWS } from "../config/table.config";
 
export function TableSkeleton() {
  return (
    <div>
      {Array.from({ length: SKELETON_ROWS }).map((_, r) => (
        <div
          key={r}
          className="grid items-center border-b border-[#CAC0D5]/20 px-3"
          style={{ gridTemplateColumns: GRID_COLS, height: ROW_HEIGHT }}
        >
          {Array.from({ length: 8 }).map((__, c) => (
            <div key={c} className="pr-4">
              <div className="h-3 w-full max-w-20 animate-pulse rounded-none bg-violet/10" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}