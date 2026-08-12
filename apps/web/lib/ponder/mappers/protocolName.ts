// HealthOracle's protocolId is a bytes32 that's just the protocol's slug,
// ASCII-encoded and right-padded with zero bytes (e.g. "kodiak" ->
// 0x6b6f6469616b0000...0000) - decoding it back to text needs no registry,
// unlike category/target-weight (see AllocationRow's still-unwired gap).
export function decodeProtocolName(protocolId: string): string {
  const hex = protocolId.startsWith("0x") ? protocolId.slice(2) : protocolId;
  const bytes: number[] = [];
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (!byte) break; // stop at the zero-byte padding
    bytes.push(byte);
  }
  if (bytes.length === 0) return protocolId;
  const raw = String.fromCharCode(...bytes);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
