# Arc Microgrants — DoraHacks paste fields

Program: [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants) (Circle / DoraHacks)
Event page: https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq

Twenty grants of **500 USDC** from a 10,000 USDC pool. Deadline **14 October 2026, 23:59 ET**. Decisions by 21 October. Paid in USDC **on Arc**. Testnet-only builds are not eligible.

Copy the blocks below into the BUIDL form. Replace every `TODO` after you broadcast on mainnet.

---

## BUIDL name

```text
Pulse Receipt
```

## Tagline / one-liner

```text
Immutable Pulse-style market-alert receipts on Arc — hash, cmcId, threshold, timestamp, optional note. Gas is native USDC.
```

```text
Arc 上的 Pulse 行情告警回执：把 hash、cmcId、阈值、时间和备注写成不可变记录，gas 用原生 USDC。
```

## What does your project do?

```text
Pulse Receipt is a tiny on-chain registry for Pulse Screener. When a market alert fires (or a user stamps manually), a wallet calls stampReceipt(cmcId, alertHash, threshold, kind, note) on Arc. The contract emits ReceiptStamped and stores the same fields so anyone can list recent receipts without a backend indexer.

A minimal web page connects an injected wallet, switches to Arc, submits the stamp, shows the Arc explorer transaction link, and reads recent receipts from contract storage / events.

This is the thin on-chain layer only. Pulse Go backend indexing is optional and not required for this MVP.
```

```text
Pulse Receipt 是 Pulse Screener 的最小链上回执登记。行情告警触发（或用户手工盖章）后，钱包在 Arc 上调用 stampReceipt。合约发出 ReceiptStamped，并把同样字段存下来，所以没有 Go 索引器也能列出最近回执。

配套静态页：连接钱包、切换到 Arc、提交盖章、打开浏览器交易链接、从存储/事件读取回执。只做链上薄层，后端索引不是本 MVP 的一部分。
```

## What does it use Arc for? / How it uses Arc

```text
Arc is the settlement and gas layer, not a side-chain afterthought.

1. The receipt contract is deployed on Arc (chainId 5042 mainnet / 5042002 testnet).
2. Every stamp is an EVM transaction paid in native USDC. Fees are dollar-denominated, which matches a market-alert audit trail.
3. Finality is on inclusion, so the UI treats a single confirmation as “stamped.”
4. The UI adds Arc to the wallet (RPC https://rpc.mainnet.arc.io, explorer https://explorer.arc.io) and links each tx on the official Blockscout explorer.
5. We document Arc’s dual-USDC interface: native 18 decimals for gas vs ERC-20 6 decimals at 0x3600000000000000000000000000000000000000. Same balance, do not mix.

Without Arc’s USDC-native gas, a “dollar receipt” would still require a volatile fee token. That is the Arc-native reason this exists.
```

```text
Arc 是结算和 gas 层，不是事后挂上的侧链。

1. 回执合约部署在 Arc（主网 5042 / 测试网 5042002）。
2. 每次盖章都是一笔用原生 USDC 付费的 EVM 交易，费用按美元计价，和行情告警审计痕迹一致。
3. 出块即终局，页面把一次确认当成已盖章。
4. 页面会把 Arc 加进钱包，并在官方浏览器给出交易链接。
5. 文档写清 USDC 双接口：原生 18 位付 gas，ERC-20 6 位在 0x3600…000，同一余额不可混用。

如果 gas 仍是波动代币，「美元回执」就不成立。这就是它必须建在 Arc 上的原因。
```

## Live deployment (mainnet)

```text
TODO after mainnet broadcast

Web UI: https://TODO
Contract: https://explorer.arc.io/address/TODO
Example stamp tx: https://explorer.arc.io/tx/TODO
RPC used: https://rpc.mainnet.arc.io
Chain ID: 5042
```

## Public repository

```text
TODO — public git URL of this repo
```

## Demo / video (optional)

```text
Open the web UI → Connect wallet → Switch to Arc → paste the verified PulseReceipt address → Stamp on Arc → click the explorer link → confirm ReceiptStamped in Recent receipts.

1 分钟操作：打开页面 → 连钱包 → 切到 Arc → 粘贴已验证合约地址 → Stamp on Arc → 点浏览器链接 → 在 Recent receipts 看到记录。
```

## Public builder profile

```text
TODO — GitHub / X / Farcaster URL
```

## Tracks / tags

```text
Arc · Circle · USDC gas · DeFi infra · Market alerts · Mini-app
```

## Why this is in scope

Microgrants fund proofs of concept, tiny apps, demos, and technical experiments that are **already deployed and working on Arc mainnet**. Pulse Receipt is exactly that: one small contract, one static page, real USDC gas, no deck.

Not a mockup. Not testnet-only (after you fill the TODOs above). Not previously funded by a Circle / Arc program.

---

## Submission checklist

1. `forge test` passes locally.
2. Deployer wallet already has native USDC on Arc mainnet (18-decimal gas). Optional: rehearse on testnet first.
3. With `PRIVATE_KEY` exported in the local shell only:
   ```bash
   CONFIRM_MAINNET=1 ARC_RPC_URL=https://rpc.mainnet.arc.io ./script/deploy-mainnet.sh
   ./script/verify.sh 0xDeployedAddress mainnet
   ```
4. Point the UI at the address (`Contract` field, `VITE_PULSE_RECEIPT_ADDRESS`, or `?address=0x…&network=mainnet`).
5. Stamp once from the UI. Copy `https://explorer.arc.io/tx/…` into the live-deployment field.
6. Create / update a DoraHacks BUIDL, paste the fields above, attach repo + live link + builder profile.
7. Submit at https://dorahacks.io/hackathon/arc-microgrants (one submission per project).
8. Keep a wallet that can receive 500 USDC on Arc if selected.

## Commands cheat sheet

```bash
forge test

# mainnet
CONFIRM_MAINNET=1 ARC_RPC_URL=https://rpc.mainnet.arc.io ./script/deploy-mainnet.sh
./script/verify.sh 0xDeployedAddress mainnet

# optional testnet rehearsal
ARC_RPC_URL=https://rpc.testnet.arc.io ./script/deploy-testnet.sh
./script/verify.sh 0xDeployedAddress testnet

cast send 0xDeployedAddress \
  "stampReceipt(uint256,bytes32,int256,uint8,string)" \
  1 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef 500 0 "BTC above threshold" \
  --rpc-url https://rpc.mainnet.arc.io \
  --private-key "$PRIVATE_KEY"
```
