export const pulseReceiptAbi = [
  {
    type: "function",
    name: "stampReceipt",
    stateMutability: "nonpayable",
    inputs: [
      { name: "cmcId", type: "uint256" },
      { name: "alertHash", type: "bytes32" },
      { name: "threshold", type: "int256" },
      { name: "kind", type: "uint8" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "receiptCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getReceipt",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "stamper", type: "address" },
          { name: "cmcId", type: "uint256" },
          { name: "alertHash", type: "bytes32" },
          { name: "threshold", type: "int256" },
          { name: "kind", type: "uint8" },
          { name: "note", type: "string" },
          { name: "stampedAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "ReceiptStamped",
    inputs: [
      { name: "stamper", type: "address", indexed: true },
      { name: "cmcId", type: "uint256", indexed: true },
      { name: "alertHash", type: "bytes32", indexed: false },
      { name: "threshold", type: "int256", indexed: false },
      { name: "kind", type: "uint8", indexed: false },
      { name: "note", type: "string", indexed: false },
      { name: "stampedAt", type: "uint256", indexed: false },
    ],
  },
] as const;
