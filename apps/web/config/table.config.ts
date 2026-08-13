// Protocol, Health, 24h Δ, Action, Flags - TVL/TVL 24h columns were
// dropped (Protocol/Columns.tsx: no live TVL source wired into this
// table's DB read yet, same reasoning as STRATEGY_GRID_COLS below).
export const GRID_COLS =
  "minmax(180px,1.6fr) 116px 96px 152px minmax(160px,1fr)";

// Strategy, Health, Fees - APY/TVL columns were dropped (StrategyColumns.tsx,
// this is a strategy catalog now, not a live position dashboard).
export const STRATEGY_GRID_COLS =
  "minmax(220px,1.6fr) 140px 140px";

export const VAULT_GRID_COLS =
  "minmax(220px,1.6fr) 90px 110px 110px";

export const ROW_HEIGHT = 52;
export const OVERSCAN = 8;