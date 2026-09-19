import { encodePacked, isHash, keccak256, type Hash } from "viem";

export function deriveAlertHash(input: {
  cmcId: bigint;
  threshold: bigint;
  kind: number;
  note: string;
  salt?: string;
}): Hash {
  return keccak256(
    encodePacked(
      ["uint256", "int256", "uint8", "string", "string"],
      [input.cmcId, input.threshold, input.kind, input.note, input.salt ?? "pulse"],
    ),
  );
}

export function parseAlertHash(value: string): Hash | null {
  const trimmed = value.trim();
  if (!isHash(trimmed) || trimmed === "0x" + "0".repeat(64)) return null;
  return trimmed;
}
