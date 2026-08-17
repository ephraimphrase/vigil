import type { EmergencyZeroedsQuery, ProtocolRegisteredsQuery, ScoreUpdatedsQuery } from "@/lib/ponder/generated/sdk";

type PonderProtocolRegistered = ProtocolRegisteredsQuery["protocolRegistereds"]["items"][number];
type PonderScoreUpdated = ScoreUpdatedsQuery["scoreUpdateds"]["items"][number];
type PonderEmergencyZeroed = EmergencyZeroedsQuery["emergencyZeroeds"]["items"][number];

export function latestScoreByProtocol(
  registrations: PonderProtocolRegistered[],
  updates: PonderScoreUpdated[],
  zeroes: PonderEmergencyZeroed[],
): Map<string, number> {
  const latestAt = new Map<string, number>();
  const latestScore = new Map<string, number>();

  const consider = (protocolId: string, score: number, timestamp: number) => {
    const at = latestAt.get(protocolId);
    if (at === undefined || timestamp >= at) {
      latestAt.set(protocolId, timestamp);
      latestScore.set(protocolId, score);
    }
  };

  for (const r of registrations) consider(r.protocolId, r.initialScore, Number(r.timestamp));
  for (const u of updates) consider(u.protocolId, u.newScore, Number(u.timestamp));
  for (const z of zeroes) consider(z.protocolId, 0, Number(z.timestamp));

  return latestScore;
}

interface WeighableAdapter {
  protocolId: string;
  allocated: string;
  retired: boolean;
}

export function weightedHealth(adapters: WeighableAdapter[], scoreByProtocol: Map<string, number>): number {
  const live = adapters.filter((a) => !a.retired);

  let totalAllocated = 0;
  let weightedScore = 0;
  for (const a of live) {
    const allocated = Number(a.allocated);
    const score = scoreByProtocol.get(a.protocolId) ?? 0;
    totalAllocated += allocated;
    weightedScore += score * allocated;
  }

  return totalAllocated > 0 ? weightedScore / totalAllocated : 0;
}
