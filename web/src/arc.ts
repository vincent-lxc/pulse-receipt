import { defineChain } from "viem";

export const USDC_ERC20 = "0x3600000000000000000000000000000000000000" as const;

export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Testnet Explorer", url: "https://explorer.testnet.arc.io" },
  },
});

export type NetworkKey = "testnet" | "mainnet";

export function chainFor(network: NetworkKey) {
  return network === "mainnet" ? arcMainnet : arcTestnet;
}

export function explorerTx(network: NetworkKey, hash: string) {
  return `${chainFor(network).blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddress(network: NetworkKey, address: string) {
  return `${chainFor(network).blockExplorers.default.url}/address/${address}`;
}

export function walletChainParams(network: NetworkKey) {
  const chain = chainFor(network);
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [...chain.rpcUrls.default.http],
    blockExplorerUrls: [chain.blockExplorers.default.url],
  };
}

export function rpcUrlFor(network: NetworkKey) {
  if (import.meta.env.DEV) {
    return network === "mainnet" ? "/rpc/mainnet" : "/rpc/testnet";
  }
  return chainFor(network).rpcUrls.default.http[0];
}
