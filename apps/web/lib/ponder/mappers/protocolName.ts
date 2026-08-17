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
