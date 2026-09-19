# Pulse Receipt


## Mainnet deployment (Arc, chainId 5042)

- Contract: [`0x4FACE6592Ba1AdF83E35B01CcD93D8704d647C01`](https://explorer.arc.io/address/0x4FACE6592Ba1AdF83E35B01CcD93D8704d647C01)
- Deploy tx: [`0x6cee9ea9a7ea89ecec9be87228175b1806cae67a61511569a5b08b49a359f3e0`](https://explorer.arc.io/tx/0x6cee9ea9a7ea89ecec9be87228175b1806cae67a61511569a5b08b49a359f3e0)
- Demo stamp tx: [`0xb686190e05b44c0be840db1f2b3ff505b791eef482d6daec0c8f603bef2ebb06`](https://explorer.arc.io/tx/0xb686190e05b44c0be840db1f2b3ff505b791eef482d6daec0c8f603bef2ebb06)
- Deployer: `0x60C35aBAF3B7eA46646e8e796181c9b583C191C7`

A tiny on-chain receipt registry on **Arc** (Circle). When a Pulse-style market alert fires — or a user stamps by hand — the contract writes an immutable record: `alertHash + cmcId + threshold + timestamp + optional note`.

This is the thin Arc layer next to Pulse Screener. A Pulse Go indexer is optional and **not** required for the Arc Microgrant MVP.

Arc 上的最小回执登记：Pulse 风格行情告警触发（或用户手工盖章）后，把 `hash + cmcId + 阈值 + 时间 + 可选备注` 写成不可变记录。这是 Pulse Screener 的链上薄层；Go 后端索引是可选项，Microgrant MVP 不需要。

- License: MIT
- Stack: Solidity 0.8.24 + Foundry · Vite + viem
- Gas: **native USDC** (see the decimals gotcha below)

## Why Arc / 为什么用 Arc

Arc is an EVM L1 where **USDC is the gas token**. A market-alert receipt is a dollar-denominated audit trail: you pay a predictable USDC fee to notarize that “CMC id X crossed threshold Y at time T.” No volatile gas token, sub-second finality, same Solidity tooling.

Arc 用 USDC 付 gas。行情告警回执本质是「美元计价的审计痕迹」：花一笔可预期的 USDC，把「某 CMC id 在某时刻越过某阈值」公证上链。没有波动 gas 代币，终局在出块时确定，Solidity / Foundry / 钱包原样可用。

That is why this qualifies for [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants) (Circle / DoraHacks): it is a working, tiny app that **must** live on Arc mainnet — the receipt is only meaningful if gas and settlement are USDC.

这就是它符合 Arc Microgrants 的原因：一个必须部署在 Arc 主网才能成立的小工具——回执的意义建立在「gas 和结算都是 USDC」上。

Paste-ready DoraHacks fields: [`docs/arc-microgrant.md`](docs/arc-microgrant.md).

## Arc networks / 网络参数

| | Mainnet | Testnet |
| --- | --- | --- |
| Chain ID | `5042` (`0x13b2`) | `5042002` (`0x4cef52`) |
| RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` |
| Explorer | https://explorer.arc.io | https://explorer.testnet.arc.io (also [testnet.arcscan.app](https://testnet.arcscan.app)) |
| Faucet | none — real USDC | [Circle Faucet](https://faucet.circle.com) → Arc Testnet |
| Native gas | USDC, **18 decimals** | same |
| ERC-20 USDC | `0x3600000000000000000000000000000000000000`, **6 decimals** | same address |

Official references: [stablecoin-native model](https://docs.arc.io/arc/concepts/stablecoin-native-model), [deploy on Arc](https://docs.arc.io/integrate/deploy-on-arc).

## USDC decimals gotcha / 精度陷阱

Arc exposes **one USDC balance through two interfaces**. Mixing them is off by `1e12`.

Arc 把**同一笔 USDC 余额**暴露成两种接口。混用会差 `10^12`。

| Interface | Decimals | Used for |
| --- | --- | --- |
| Native (`eth_getBalance`, `msg.value`, gas) | 18 | Pay fees, native sends |
| ERC-20 at `0x3600…000` (`balanceOf`, `transfer`) | 6 | App-level transfers / allowances |

- Wallets should show one USDC row and divide the 18-decimal native figure by `1e12`.
- `USDC.balanceOf(addr) == 0` does **not** mean the native balance is empty (sub-micro USDC is truncated).
- There is **no WETH-style wrapper**. Do not wrap native USDC.
- This contract does **not** take `msg.value`. You still pay gas in 18-decimal native USDC.
- Foundry / MetaMask treat the native symbol as `USDC` with 18 decimals. When you fund a deployer, send real USDC onto Arc (CCTP / Circle bridge), not ERC-20 units you then treat as wei.

钱包应只显示一行 USDC，并把 18 位原生余额除以 `1e12`。`balanceOf == 0` 不代表原生余额为零。没有 WETH 式包装合约。本合约不收 `msg.value`，但 gas 仍按 18 位原生 USDC 扣。给部署钱包打钱时，打的是 Arc 上的真实 USDC。

## Contract / 合约

[`src/PulseReceipt.sol`](src/PulseReceipt.sol) is ~2 KB. It emits:

```text
ReceiptStamped(
  address indexed stamper,
  uint256 indexed cmcId,
  bytes32 alertHash,
  int256 threshold,
  uint8 kind,
  string note,
  uint256 stampedAt
)
```

- `kind = 0` alert (Pulse fire) · `kind = 1` manual stamp
- `alertHash` must be non-zero
- `note` max 280 bytes (empty allowed)
- Storage + event: the UI can list receipts without a Pulse Go indexer

## Quick start / 本地

```bash
# Foundry
foundryup
forge test
forge fmt --check

# Web UI (no key required)
cd web
npm install
npm run dev          # http://127.0.0.1:43147
```

The UI can connect a wallet, call `stampReceipt`, show the Arc explorer tx link, and list recent receipts from storage (events when the RPC allows).

页面可连接钱包、调用 `stampReceipt`、给出 Arc 浏览器交易链接，并从存储（以及 RPC 允许时的事件）列出最近回执。

## Mainnet deploy / 主网部署（MVP）

Target: **Arc mainnet** `chainId 5042`, RPC `https://rpc.mainnet.arc.io`, explorer https://explorer.arc.io.

Signing key is read from the environment variable `PRIVATE_KEY` only. Do not put a key in the repo, in Foundry scripts, or on the command line as a literal.

密钥只从环境变量 `PRIVATE_KEY` 读取。不要写进仓库、合约脚本，也不要在命令行里写成字面量。

```bash
cp .env.example .env
# set PRIVATE_KEY in .env or export it in the shell
source .env
export ARC_RPC_URL="${ARC_RPC_URL:-https://rpc.mainnet.arc.io}"
```

### forge script (preferred)

```bash
CONFIRM_MAINNET=1 ARC_RPC_URL=https://rpc.mainnet.arc.io ./script/deploy-mainnet.sh
```

Equivalent one-liner (script reads `PRIVATE_KEY` via `vm.envUint`; no `--private-key` flag):

```bash
EXPECTED_CHAIN_ID=5042 forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.mainnet.arc.io \
  --broadcast \
  --with-gas-price 30000000000 \
  -vvvv
```

`./script/deploy-mainnet.sh` also requires `CONFIRM_MAINNET=1` and refuses to run without it.

### forge create (alternative)

```bash
forge create src/PulseReceipt.sol:PulseReceipt \
  --rpc-url https://rpc.mainnet.arc.io \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --with-gas-price 30000000000
```

`--private-key "$PRIVATE_KEY"` expands the env var. Do not replace it with a hex string in history or screenshots.

Save the printed `Deployed to:` / `PulseReceipt:` address.

### Verify on explorer / 浏览器验证

```bash
./script/verify.sh 0xDeployedAddress mainnet
```

```bash
forge verify-contract 0xDeployedAddress src/PulseReceipt.sol:PulseReceipt \
  --chain-id 5042 \
  --verifier blockscout \
  --verifier-url https://explorer.arc.io/api/ \
  --watch
```

Or paste the address at https://explorer.arc.io/contract-verification (compiler 0.8.24, optimizer on, 200 runs, EVM cancun, MIT, no constructor args). Confirmed source shows a Contract tab at `https://explorer.arc.io/address/0xDeployedAddress`.

Arc’s mempool **silently drops** transactions with `maxFeePerGas` below **20 gwei**. The commands above set 30 gwei.

### Point the web UI / 页面指向合约

1. Open the Vite app (`cd web && npm run dev` → http://127.0.0.1:43147). Network defaults to **Arc Mainnet · 5042**.
2. Paste `0xDeployedAddress` into **Contract**. It is saved in this browser.
3. Or set `web/.env`:
   ```bash
   VITE_PULSE_RECEIPT_ADDRESS=0xDeployedAddress
   VITE_ARC_NETWORK=mainnet
   ```
4. Or open `http://127.0.0.1:43147/?address=0xDeployedAddress&network=mainnet`
5. Connect the funded Arc wallet → **Switch wallet to Arc** if needed → **Stamp on Arc**. The tx link goes to `https://explorer.arc.io/tx/…`.

### Optional testnet rehearsal / 可选测试网预演

```bash
ARC_RPC_URL=https://rpc.testnet.arc.io ./script/deploy-testnet.sh
./script/verify.sh 0xDeployedAddress testnet
```

Testnet-only builds are **not** eligible for Arc Microgrants.

## Web / 页面

[`web/`](web/) is a static Vite page (viem, injected wallet). It:

1. Connects a wallet and adds Arc (testnet or mainnet) if missing
2. Calls `stampReceipt(cmcId, alertHash, threshold, kind, note)`
3. Links the tx on the Arc explorer
4. Lists recent receipts (`getReceipt` + `ReceiptStamped` logs)

Dev server proxies `/rpc/testnet` and `/rpc/mainnet` so the browser can read Arc without CORS surprises. The wallet still uses its own RPC for the write.

开发服务器会代理公共 RPC，避免浏览器 CORS；写交易仍走钱包自己的 RPC。

## Microgrant checklist / 提交清单

See [`docs/arc-microgrant.md`](docs/arc-microgrant.md) for paste fields.

- [ ] `forge test` green
- [ ] Contract deployed and **verified** on Arc **mainnet** (testnet-only is ineligible)
- [ ] UI hosted or openable, pointed at the mainnet address
- [ ] Public repo (this one)
- [ ] Explorer links: contract + at least one `stampReceipt` tx
- [ ] Short “what it does / what it uses Arc for” text
- [ ] Public builder profile (GitHub / X / Farcaster)
- [ ] No secrets in git
- [ ] Submit at [dorahacks.io/hackathon/arc-microgrants](https://dorahacks.io/hackathon/arc-microgrants) before **14 Oct 2026 23:59 ET**

Not eligible: mockups, decks, testnet-only builds, projects with no Arc component.

## Project layout

```text
src/PulseReceipt.sol       contract
test/PulseReceipt.t.sol    Foundry tests
script/Deploy.s.sol        shared deploy script
script/deploy-testnet.sh
script/deploy-mainnet.sh   Arc mainnet; requires CONFIRM_MAINNET=1
script/verify.sh
web/                       Vite + viem UI
docs/arc-microgrant.md     DoraHacks paste fields
```
