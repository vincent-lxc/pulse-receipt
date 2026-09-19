#!/usr/bin/env bash
# Optional rehearsal: deploy PulseReceipt to Arc testnet (chainId 5042002).
# Reads PRIVATE_KEY from the environment only. Never prints it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "PRIVATE_KEY is not set in the environment. Export it locally; do not commit it."
  exit 1
fi

RPC_URL="${ARC_RPC_URL:-${ARC_TESTNET_RPC_URL:-https://rpc.testnet.arc.io}}"
export EXPECTED_CHAIN_ID="${EXPECTED_CHAIN_ID:-5042002}"

echo "Rehearsal deploy to Arc testnet (chainId 5042002)"
echo "RPC: $RPC_URL"

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --with-gas-price 30000000000 \
  -vvvv
