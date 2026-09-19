#!/usr/bin/env bash
# Deploy PulseReceipt to Arc mainnet (chainId 5042).
# Reads PRIVATE_KEY from the environment only. Never prints it.
# Refuses to broadcast unless CONFIRM_MAINNET=1.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${CONFIRM_MAINNET:-}" != "1" ]]; then
  echo "Refusing mainnet broadcast."
  echo "Export PRIVATE_KEY in this shell (do not paste it into git), then:"
  echo "  CONFIRM_MAINNET=1 ARC_RPC_URL=https://rpc.mainnet.arc.io ./script/deploy-mainnet.sh"
  exit 1
fi

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "PRIVATE_KEY is not set in the environment. Export it locally; do not commit it."
  exit 1
fi

RPC_URL="${ARC_RPC_URL:-${ARC_MAINNET_RPC_URL:-https://rpc.mainnet.arc.io}}"
export EXPECTED_CHAIN_ID="${EXPECTED_CHAIN_ID:-5042}"

echo "Deploying PulseReceipt to Arc mainnet (chainId 5042)"
echo "RPC: $RPC_URL"
echo "Gas is native USDC (18 decimals). ERC-20 USDC at 0x3600…000 uses 6 decimals — do not mix them."
echo "Arc mempool drops txs with maxFeePerGas < 20 gwei; this script sets 30 gwei."

# Signing key is read inside Deploy.s.sol via vm.envUint("PRIVATE_KEY").
# Do not pass --private-key on the CLI (it would appear in process lists).
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --with-gas-price 30000000000 \
  -vvvv
