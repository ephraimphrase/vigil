export const VaultFactoryAbi = [
  {
    type: "function",
    name: "createVault",
    inputs: [
      {
        name: "asset",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "kind",
        type: "uint8",
        internalType: "enum IVigilVault.VaultKind",
      },
      {
        name: "oracle",
        type: "address",
        internalType: "contract HealthOracle",
      },
      {
        name: "admin",
        type: "address",
        internalType: "address",
      },
      {
        name: "keeper",
        type: "address",
        internalType: "address",
      },
      {
        name: "guardian",
        type: "address",
        internalType: "address",
      },
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbol",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "vault",
        type: "address",
        internalType: "contract VigilVault",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vaultByAsset",
    inputs: [
      {
        name: "asset",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "vault",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaults",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "VaultCreated",
    inputs: [
      {
        name: "asset",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "oracle",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "kind",
        type: "uint8",
        indexed: false,
        internalType: "enum IVigilVault.VaultKind",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "VaultAlreadyExists",
    inputs: [
      {
        name: "asset",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: [],
  },
] as const;
