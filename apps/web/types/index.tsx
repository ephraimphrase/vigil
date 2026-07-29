import type { SystemState } from "@/components/Layouts/StatusPill";

/* ╔════════════════════════════════════════════╗
   ║                Protocols                   ║
   ╚════════════════════════════════════════════╝ */
export interface ProtocolRow {
    id: string;          
    name: string;         
    ticker: string;       
    score: number;         
    delta24h: number;      
    tvl: number;          
    tvlDelta24h: number;  
    riskFlags: string[];   
  }

export type Category = "rollup" | "lending" | "dex" | "lsd" | "cdp";
export type Band = "hold" | "reduce_25" | "reduce_50" | "exit";
export type Action = "reduce_25" | "reduce_50" | "exit";
export type Trend = "up" | "down" | "flat";
export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type SignalStatus = "live" | "manual" | "derived" | "unavailable";
export type Confidence = "low" | "medium" | "high";
 

export interface Signal {
  label: string;
  raw: string | number;
  normalized: number;  
  trend: Trend;
  weight: number;      
  source: string;
  status: SignalStatus;
  unit?: string;
}
 
export interface SignalGroups {
  onchain: Record<string, Signal>;
  offchain: Record<string, Signal>;
  typed: Record<string, Signal>;
}
 
export interface Assessment {
  summary: string;
  riskFlags: string[];
  confidence: Confidence;
  updatedAt: string;    
}
 
export interface AssessmentSnapshot {
  ts: string;
  score: number;
  summary: string;
}
 
export interface ScorePoint {
  ts: string;
  score: number;
  avg24h: number;
  trigger?: { action: Action; reason: string };
}
 
export interface Health {
  score: number;      
  band: Band;
  delta24h: number;
  delta7d: number;
  assessment: Assessment;
  assessmentHistory: AssessmentSnapshot[];
}
 
export interface Market {
  price: number;
  marketCap: number;
  fdv: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d?: number;
  circulating?: number;
  maxSupply?: number;
  rank?: number;
  athMultiple?: string;
  tokenNote?: string;
}
 
export interface Links {
  website?: string;
  docs?: string;
  github?: string;
  twitter?: string;
  defillama?: string;
  explorer?: string;
  l2beat?: string;
  makerburn?: string;
  audits?: string[];
}
 
export interface Identity {
  id: string;
  name: string;
  ticker: string | null;         
  aliases: string[];
  category: Category;
  chain: string;                 
  settlementLayer: string | null;
  kind: string;
  description: string;
  launchDate: string;
  ageDays: number;
  links: Links;
}
 
export interface RiskRow {
  category: string;
  severity: Severity;
  title: string;
  note: string;
  source: string;
}
 
export interface TriggerRecord {
  ts: string;
  score: number;
  delta: number;
  action: Action;
  reason: string;
}
 
export interface ContractRef {
  label: string;
  address: string;
  kind: string;
}
 
export interface Incident {
  ts: string;
  type: string;
  severity: Severity;
  title: string;
  note: string;
}
 
export interface Dependency {
  type: string;
  target: string;
  note: string;
}
 
export interface ProtocolDetail {
  identity: Identity;
  health: Health;
  market: Market | null;
  scoreHistory: ScorePoint[];
  signals: SignalGroups;
  risk: RiskRow[];
  triggers: TriggerRecord[];
  contracts: ContractRef[];
  incidents: Incident[];
  dependencies: Dependency[];
  askSuggestions: string[];
}
 
export interface ProtocolDetailDoc {
  meta: {
    schemaVersion: string;
    generatedAt: string;
    note: string;
    signalConvention: string;
    bands: Record<Band, string>;
  };
  protocols: ProtocolDetail[];
}


/* ╔════════════════════════════════════════════╗
   ║          Dashboard Overview                ║
   ╚════════════════════════════════════════════╝ */

export interface Portfolio {
  totalValue: number;     
  shares: number;         
  sharePrice: number;      
  pnl24h: number;         
  pnlPct24h: number;       
  benchmarkDeltaPct: number; 
}

export interface Position {
  protocolId: string;
  name: string;
  category: Category;
  allocated: number;      
  targetWeight: number;   
  actualWeight: number;   
  score: number;          
  apy: number;           
  lastRebalance: string; 
}

export type EventKind = "score" | "trigger" | "execution" | "alert" | "cycle";

export interface FeedEvent {
  id: string;
  ts: string;             
  kind: EventKind;
  protocolId?: string;
  message: string;
  score?: number;
  action?: string;
  txHash?: string;
}

export interface OverviewData {
  status: { state: SystemState; watchedCount: number; lastCycle: string };
  portfolio: Portfolio;
  positions: Position[];
  events: FeedEvent[];
  pendingApprovals: number;
}

/* ╔════════════════════════════════════════════╗
   ║                Strategy                    ║
   ╚════════════════════════════════════════════╝ */
export type StrategyStatus = "active" | "paused" | "exiting";

export interface Strategy {
  protocolId: string;    
  name: string;
  category: Category;
  adapter: string;        
  asset: string;          
  allocated: number;       
  targetWeight: number;   
  actualWeight: number;   
  score: number;       
  apy: number;            
  lastRebalance: string;  
  status: StrategyStatus;
}

export interface VaultBuffer {
  asset: string;        
  totalAssets: number;    
  idle: number;            
}

export interface StrategiesData {
  vault: VaultBuffer;
  strategies: Strategy[];
}

/* ╔════════════════════════════════════════════╗
   ║                Vault                       ║
   ╚════════════════════════════════════════════╝ */
export type AutonomyLevel = "watch" | "alert" | "approve" | "auto";

export interface VaultPolicy {
  name: string;                 
  maxWeightPerProtocol: number;
  exitFloorScore: number;      
  cooldownHours: number;      
  autonomyDefault: AutonomyLevel;
  excludedProtocols: string[];
}

export interface VaultInfo {
  asset: string;              
  totalAssets: number;         
  totalShares: number;
  sharePrice: number;           
  idle: number;                
  tvl: number;                 
  benchmarkDeltaPct: number;    
}

export interface UserPosition {
  shares: number;
  valueUsd: number;             
  costBasisUsd: number;         
  pnlUsd: number;
  walletUsdc: number;           
}

export interface AllocationRow {
  protocolId: string;
  name: string;
  category: Category;
  targetWeight: number;         
  actualWeight: number;         
  valueUsd: number;             
  score: number;
}

export interface VaultData {
  info: VaultInfo;
  policy: VaultPolicy;
  position: UserPosition | null; 
  allocation: AllocationRow[];
}

