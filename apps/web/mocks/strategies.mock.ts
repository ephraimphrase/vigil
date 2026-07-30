import moment from "moment";
import type { Strategy, StrategiesData } from "../types";

const iso = (h: number) => moment().subtract(h, "hours").toISOString();

// Every entry is shaped like a real IVigilProtocolAdapter read: `allocated`
// is totalAssets(), `maxWithdraw` mirrors the adapter's own maxWithdraw()
// (optimistic - equals totalAssets() since no wrapped strategy exposes real
// liquidity), `maxDeposit` is null (unbounded) whenever paused/retired are
// both false, same as the adapter's own logic. depositFee/withdrawFee
// default to StratFeeManagerInitializable's own defaults (0% / 0.1%).
type StrategyInput = Omit<Strategy, "maxWithdraw" | "maxDeposit" | "depositFee" | "withdrawFee"> &
  Partial<Pick<Strategy, "maxDeposit" | "depositFee" | "withdrawFee">>;

const strategy = (s: StrategyInput): Strategy => ({
  ...s,
  maxWithdraw: s.allocated,
  maxDeposit: s.maxDeposit ?? (s.paused || s.retired ? 0 : null),
  depositFee: s.depositFee ?? 0,
  withdrawFee: s.withdrawFee ?? 0.001,
});

export const MOCK_STRATEGIES: StrategiesData = {
  vault: { asset: "USDC", totalAssets: 48250, idle: 0 },
  strategies: [
    strategy({
      protocolId: "aave", name: "Aave", category: "lending",
      description: "Supplies USDC directly to Aave V3's lending pool, earning variable supply interest as aUSDC. Accrued AAVE/incentive rewards are periodically claimed, swapped to the vault asset, and compounded back into the position.",
      adapter: "0x7a1f...9c02", strategyAddress: "0x4e2d...11c4",
      asset: "USDC", want: "USDC",
      allocated: 16800, targetWeight: 0.30, actualWeight: 0.348, score: 79, apy: 4.8,
      lastRebalance: iso(8), status: "active", paused: false, retired: false,
      lastHarvest: iso(6), harvestable: true,
    }),
    strategy({
      protocolId: "lido", name: "Lido", category: "lsd",
      description: "Holds wstETH as `want`, earning Ethereum consensus-layer staking rewards that accrue directly into the wstETH exchange rate. No separate reward token to harvest - yield is realized by periodically redeeming the appreciated wstETH balance back to the vault asset.",
      adapter: "0x3b8e...41aa", strategyAddress: "0x9d61...7fa0",
      asset: "USDC", want: "wstETH",
      allocated: 14200, targetWeight: 0.30, actualWeight: 0.294, score: 83, apy: 3.1,
      lastRebalance: iso(26), status: "active", paused: false, retired: false,
      lastHarvest: iso(24), harvestable: true,
    }),
    strategy({
      protocolId: "sky", name: "Sky", category: "cdp",
      description: "Deposits USDS into Sky's Savings Module (sUSDS), earning the Sky Savings Rate on a stablecoin backed by overcollateralized crypto vaults, a USDC Peg Stability Module, and tokenized RWA Treasuries.",
      adapter: "0x56c0...7d19", strategyAddress: "0xa817...2b3e",
      asset: "USDC", want: "sUSDS",
      allocated: 12100, targetWeight: 0.25, actualWeight: 0.251, score: 81, apy: 3.75,
      lastRebalance: iso(26), status: "active", paused: false, retired: false,
      lastHarvest: iso(25), harvestable: true,
    }),
    strategy({
      protocolId: "uniswap", name: "Uniswap", category: "dex",
      description: "Provides USDC/WETH concentrated liquidity to a Uniswap pool via a reward-gauge strategy. Trading-fee and incentive rewards are harvested, swapped back into both LP legs, and redeposited to compound the position.",
      adapter: "0x1f98...8aaf", strategyAddress: "0xc36c...5e91",
      asset: "USDC", want: "USDC/WETH LP",
      allocated: 5150, targetWeight: 0.15, actualWeight: 0.107, score: 88, apy: 9.2,
      lastRebalance: iso(50), status: "active", paused: false, retired: false,
      lastHarvest: iso(49), harvestable: true,
    }),
  ],
};
