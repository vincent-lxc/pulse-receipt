#!/usr/bin/env bash
# Verify PulseReceipt on Arc Blockscout.
# Usage: ./script/verify.sh <deployed-address> [mainnet|testnet]
# Defaults to mainnet (5042).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ADDRESS="${1:-}"
NETWORK="${2:-mainnet}"

if [[ -z "$ADDRESS" ]]; then
  echo "Usage: $0 <deployed-address> [mainnet|testnet]"
  exit 1
fi

if [[ "$NETWORK" == "testnet" ]]; then
  CHAIN_ID=5042002
  VERIFIER_URL="https://explorer.testnet.arc.io/api/"
else
  CHAIN_ID=5042
  VERIFIER_URL="https://explorer.arc.io/api/"
fi

echo "Verifying $ADDRESS on $NETWORK (chain $CHAIN_ID)"

forge verify-contract "$ADDRESS" src/PulseReceipt.sol:PulseReceipt \
  --chain-id "$CHAIN_ID" \
  --verifier blockscout \
  --verifier-url "$VERIFIER_URL" \
  --watch
