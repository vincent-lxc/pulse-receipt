import "./style.css";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  type Address,
  type Hash,
} from "viem";
import { pulseReceiptAbi } from "./abi";
import {
  chainFor,
  explorerAddress,
  explorerTx,
  rpcUrlFor,
  walletChainParams,
  type NetworkKey,
} from "./arc";
import { deriveAlertHash, parseAlertHash } from "./hash";

const STORAGE_KEY = "pulse-receipt.v2";

type Stored = {
  network: NetworkKey;
  contracts: Partial<Record<NetworkKey, string>>;
};

type ReceiptRow = {
  id?: bigint;
  stamper: Address;
  cmcId: bigint;
  alertHash: Hash;
  threshold: bigint;
  kind: number;
  note: string;
  stampedAt: bigint;
  txHash?: Hash;
};

const els = {
  network: document.querySelector<HTMLSelectElement>("#network")!,
  connect: document.querySelector<HTMLButtonElement>("#connect")!,
  account: document.querySelector<HTMLParagraphElement>("#account")!,
  banner: document.querySelector<HTMLParagraphElement>("#banner")!,
  form: document.querySelector<HTMLFormElement>("#stamp-form")!,
  cmcId: document.querySelector<HTMLInputElement>("#cmcId")!,
  threshold: document.querySelector<HTMLInputElement>("#threshold")!,
  kind: document.querySelector<HTMLSelectElement>("#kind")!,
  note: document.querySelector<HTMLInputElement>("#note")!,
  noteCount: document.querySelector<HTMLSpanElement>("#note-count")!,
  alertHash: document.querySelector<HTMLInputElement>("#alertHash")!,
  reshuffle: document.querySelector<HTMLButtonElement>("#reshuffle")!,
  contract: document.querySelector<HTMLInputElement>("#contract")!,
  stamp: document.querySelector<HTMLButtonElement>("#stamp")!,
  switchChain: document.querySelector<HTMLButtonElement>("#switch-chain")!,
  txPanel: document.querySelector<HTMLDivElement>("#tx-panel")!,
  txStatus: document.querySelector<HTMLParagraphElement>("#tx-status")!,
  txLink: document.querySelector<HTMLAnchorElement>("#tx-link")!,
  refresh: document.querySelector<HTMLButtonElement>("#refresh")!,
  listStatus: document.querySelector<HTMLParagraphElement>("#list-status")!,
  receipts: document.querySelector<HTMLOListElement>("#receipts")!,
  nextId: document.querySelector<HTMLSpanElement>("#next-id")!,
};

let account: Address | null = null;
let hashSalt = "pulse";

function loadStore(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* ignore */
  }
  const params = new URLSearchParams(window.location.search);
  const queryNetwork = params.get("network");
  const queryAddress = params.get("address")?.trim() ?? "";
  const envNetwork = import.meta.env.VITE_ARC_NETWORK === "testnet" ? "testnet" : "mainnet";
  const envAddress = import.meta.env.VITE_PULSE_RECEIPT_ADDRESS ?? "";
  const network: NetworkKey = queryNetwork === "testnet" || queryNetwork === "mainnet" ? queryNetwork : envNetwork;
  const address = isAddress(queryAddress) ? queryAddress : envAddress;
  return {
    network,
    contracts: address ? { [network]: address } : {},
  };
}

function saveStore(store: Stored) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function network(): NetworkKey {
  return els.network.value === "mainnet" ? "mainnet" : "testnet";
}

function showBanner(text: string, kind: "ok" | "warn" | "error" = "warn") {
  els.banner.hidden = !text;
  els.banner.textContent = text;
  els.banner.classList.toggle("is-ok", kind === "ok");
  els.banner.classList.toggle("is-error", kind === "error");
}

function shortAddr(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function publicClient() {
  return createPublicClient({
    chain: chainFor(network()),
    transport: http(rpcUrlFor(network())),
  });
}

function walletClient() {
  if (!window.ethereum) throw new Error("No injected wallet");
  return createWalletClient({
    chain: chainFor(network()),
    transport: custom(window.ethereum),
  });
}

function contractAddress(): Address | null {
  const value = els.contract.value.trim();
  return isAddress(value) ? value : null;
}

function syncHash() {
  const cmcId = BigInt(els.cmcId.value || "0");
  const threshold = BigInt(els.threshold.value || "0");
  const kind = Number(els.kind.value);
  els.alertHash.value = deriveAlertHash({
    cmcId,
    threshold,
    kind,
    note: els.note.value,
    salt: hashSalt,
  });
}

function persistContract() {
  const store = loadStore();
  store.network = network();
  store.contracts[store.network] = els.contract.value.trim();
  saveStore(store);
}

async function connectWallet() {
  if (!window.ethereum) {
    showBanner("Install a browser wallet (MetaMask, Rabby) to stamp on Arc.", "error");
    return;
  }
  const wallet = walletClient();
  const [next] = await wallet.requestAddresses();
  account = next;
  els.account.hidden = false;
  els.account.textContent = next;
  els.connect.textContent = "Wallet connected";
  showBanner("");
  await ensureChain();
}

async function ensureChain() {
  if (!window.ethereum || !account) return false;
  const wanted = chainFor(network());
  const wallet = walletClient();
  const current = await wallet.getChainId();
  if (current === wanted.id) return true;
  try {
    await wallet.switchChain({ id: wanted.id });
    return true;
  } catch {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [walletChainParams(network())],
      });
      return true;
    } catch (error) {
      showBanner(
        error instanceof Error ? error.message : "Wallet refused to switch to Arc.",
        "error",
      );
      return false;
    }
  }
}

function kindLabel(kind: number) {
  return kind === 1 ? "MANUAL" : "ALERT";
}

function renderRows(rows: ReceiptRow[]) {
  els.receipts.replaceChildren();
  if (rows.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "The roll is blank. Stamp the first receipt on Arc.";
    els.receipts.append(empty);
    return;
  }

  for (const row of rows) {
    const item = document.createElement("li");
    item.className = "ticket";
    const when = new Date(Number(row.stampedAt) * 1000);
    const time = Number.isNaN(when.getTime()) ? String(row.stampedAt) : when.toLocaleString();
    const tx = row.txHash
      ? `<a href="${explorerTx(network(), row.txHash)}" target="_blank" rel="noreferrer">${shortAddr(row.txHash)}</a>`
      : "on-chain record";
    item.innerHTML = `
      <div>
        <strong>CMC ${row.cmcId.toString()}</strong>
        <div class="meta">${shortAddr(row.stamper)} · ${time} · ${tx}</div>
        <div class="hash">${row.alertHash}</div>
        ${row.note ? `<div>${escapeHtml(row.note)}</div>` : ""}
      </div>
      <span class="kind-pill">${kindLabel(row.kind)} · ${row.threshold.toString()}</span>
    `;
    els.receipts.append(item);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[ch];
  });
}

async function loadReceipts() {
  const address = contractAddress();
  if (!address) {
    els.nextId.textContent = "—";
    els.listStatus.textContent = "Paste a deployed PulseReceipt address to load receipts.";
    renderRows([]);
    return;
  }

  els.listStatus.textContent = "Reading Arc…";
  const client = publicClient();

  try {
    const count = await client.readContract({
      address,
      abi: pulseReceiptAbi,
      functionName: "receiptCount",
    });
    els.nextId.textContent = (count + 1n).toString().padStart(4, "0");

    const rows: ReceiptRow[] = [];
    const start = count > 20n ? count - 19n : 1n;
    for (let id = count; id >= start && id > 0n; id--) {
      const stored = await client.readContract({
        address,
        abi: pulseReceiptAbi,
        functionName: "getReceipt",
        args: [id],
      });
      rows.push({
        id,
        stamper: stored.stamper,
        cmcId: stored.cmcId,
        alertHash: stored.alertHash,
        threshold: stored.threshold,
        kind: stored.kind,
        note: stored.note,
        stampedAt: stored.stampedAt,
      });
    }

    try {
      const logs = await client.getContractEvents({
        address,
        abi: pulseReceiptAbi,
        eventName: "ReceiptStamped",
        fromBlock: 0n,
        toBlock: "latest",
      });
      const byKey = new Map(
        logs.map((log) => [
          `${log.args.stamper}-${log.args.cmcId}-${log.args.alertHash}-${log.args.stampedAt}`,
          log.transactionHash,
        ]),
      );
      for (const row of rows) {
        row.txHash = byKey.get(`${row.stamper}-${row.cmcId}-${row.alertHash}-${row.stampedAt}`);
      }
    } catch {
      /* public RPC may cap historical logs; storage still shows receipts */
    }

    els.listStatus.innerHTML = `Loaded from <a href="${explorerAddress(network(), address)}" target="_blank" rel="noreferrer">${shortAddr(address)}</a> · ${count.toString()} stamped`;
    renderRows(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read Arc.";
    els.listStatus.textContent = message;
    renderRows([]);
  }
}

async function stamp(event: SubmitEvent) {
  event.preventDefault();
  const address = contractAddress();
  if (!address) {
    showBanner("Deploy PulseReceipt, then paste the contract address.", "error");
    return;
  }
  if (!window.ethereum) {
    showBanner("Connect a wallet first. Stamp writes a transaction on Arc.", "error");
    return;
  }
  if (!account) await connectWallet();
  if (!account) return;
  if (!(await ensureChain())) return;

  const hash = parseAlertHash(els.alertHash.value);
  if (!hash) {
    showBanner("Alert hash must be a non-zero bytes32.", "error");
    return;
  }

  els.stamp.disabled = true;
  els.txPanel.hidden = false;
  els.txStatus.textContent = "Waiting for signature…";
  els.txLink.hidden = true;

  try {
    const wallet = walletClient();
    const txHash = await wallet.writeContract({
      account,
      address,
      abi: pulseReceiptAbi,
      functionName: "stampReceipt",
      args: [
        BigInt(els.cmcId.value),
        hash,
        BigInt(els.threshold.value),
        Number(els.kind.value),
        els.note.value,
      ],
    });
    els.txStatus.textContent = "Submitted. Arc finalizes on inclusion.";
    els.txLink.hidden = false;
    els.txLink.href = explorerTx(network(), txHash);
    showBanner("Receipt submitted. Fees are native USDC (18 decimals).", "ok");

    const client = publicClient();
    await client.waitForTransactionReceipt({ hash: txHash });
    els.txStatus.textContent = "Stamped on Arc.";
    await loadReceipts();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stamp failed.";
    els.txStatus.textContent = message;
    showBanner(message, "error");
  } finally {
    els.stamp.disabled = false;
  }
}

function hydrate() {
  const store = loadStore();
  els.network.value = store.network;
  els.contract.value = store.contracts[store.network] ?? "";
  els.noteCount.textContent = String(els.note.value.length);
  syncHash();
  if (!window.ethereum) {
    els.connect.disabled = true;
    els.connect.textContent = "No wallet found";
  }
  void loadReceipts();
}

els.network.addEventListener("change", () => {
  const store = loadStore();
  store.network = network();
  saveStore(store);
  els.contract.value = store.contracts[store.network] ?? "";
  void ensureChain();
  void loadReceipts();
});

for (const field of [els.cmcId, els.threshold, els.kind, els.note]) {
  field.addEventListener("input", () => {
    els.noteCount.textContent = String(els.note.value.length);
    syncHash();
  });
}

els.reshuffle.addEventListener("click", () => {
  hashSalt = `${Date.now()}`;
  syncHash();
});

els.contract.addEventListener("change", () => {
  persistContract();
  void loadReceipts();
});

els.connect.addEventListener("click", () => {
  void connectWallet();
});

els.switchChain.addEventListener("click", () => {
  void ensureChain();
});

els.refresh.addEventListener("click", () => {
  void loadReceipts();
});

els.form.addEventListener("submit", (event) => {
  void stamp(event);
});

window.ethereum?.on?.("accountsChanged", (accounts) => {
  const next = Array.isArray(accounts) ? (accounts[0] as Address | undefined) : undefined;
  account = next ?? null;
  els.account.hidden = !account;
  els.account.textContent = account ?? "";
  els.connect.textContent = account ? "Wallet connected" : "Connect wallet";
});

hydrate();
