# Building Withdrawal Proofs

This package builds cryptographic proofs required for L2 to L1 withdrawals on Celo's L2 testnet (Celo Sepolia). It uses [Viem](https://viem.sh/) to interact with both L1 (Sepolia) and L2 (Celo Sepolia) networks and generates the necessary proof data for withdrawal finalization.

## Overview

When withdrawing assets from Celo L2 to Sepolia L1, a cryptographic proof must be generated to verify the withdrawal transaction on L1. This package automates the proof building process by:

1. Fetching withdrawal transaction data from L2
2. Waiting for the withdrawal to become provable (up to 1 hour)
3. Building the cryptographic proof using Viem's Optimism stack utilities
4. Outputting proof parameters for submission to L1 contracts

## Installation

Install dependencies using Yarn:

```sh
yarn install
```

## Environment Variables

The script requires the following environment variables:

**Required:**
- `PK`: Private key of the account that initiated the withdrawal (without 0x prefix)
- `TX_HASH`: Transaction hash of the withdrawal initiation on L2 (with 0x prefix)


## Usage

To build a proof for a withdrawal, run:

```sh
PK=1234567890abcdef... TX_HASH=0x1234567890abcdef... yarn build
```

## Waiting Period

**Important**: After initiating a withdrawal on L2, you must wait up to **1 hour** before the proof can be built. The script will automatically wait for the withdrawal to become provable.

**Status Messages:**
- `waiting-to-prove`: Withdrawal is not yet ready, wait and retry
- `ready-to-prove`: Withdrawal is ready, proof will be built

## Output Format

The script outputs several pieces of information. **Save all data from "Prove Args"** for the next step in the withdrawal process:

```sh
Receipt: {
  transactionHash: "0x...",
  blockNumber: 123456,
  ...
}
Status: ready-to-prove
Output: {
  outputRoot: "0x...",
  timestamp: 1234567890,
  l2BlockNumber: 123456,
  ...
}
Withdrawal: {
  nonce: 123,
  sender: "0x...",
  target: "0x...",
  value: 1000000000000000000n,
  gasLimit: 0n,
  data: "0x",
  withdrawalHash: "0x..."
}
Prove Args: {
  l2OutputIndex: 123,
  outputRootProof: {
    latestBlockhash: "0x...",
    messagePasserStorageRoot: "0x...",
    stateRoot: "0x...",
    version: "0x..."
  },
  withdrawalProof: [
    "0x...",
    "0x...",
    "0x..."
  ],
  withdrawal: {
    nonce: 123,
    sender: "0x...",
    target: "0x...",
    value: 1000000000000000000n,
    gasLimit: 0n,
    data: "0x",
    withdrawalHash: "0x..."
  }
}
```

## Proof Data for Next Step

The "Prove Args" output contains all the data needed for the `prove.sh` script:

- `l2OutputIndex` → `GAME_INDEX`
- `outputRootProof.version` → `OUTPUT_ROOT_PROOF__VERSION`
- `outputRootProof.stateRoot` → `OUTPUT_ROOT_PROOF__STATE_ROOT`
- `outputRootProof.messagePasserStorageRoot` → `OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT`
- `outputRootProof.latestBlockhash` → `OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH`
- `withdrawalProof` → `WITHDRAWAL_PROOF`
- `withdrawal.nonce` → `WITHDRAWAL_NONCE`
- `withdrawal.sender` → `SENDER`
- `withdrawal.target` → `RECIPIENT`
- `withdrawal.value` → `VALUE`

## Network Configuration

The package is configured for:
- **L1**: Sepolia testnet (Ethereum)
- **L2**: Celo Sepolia testnet
- **L2L1MessagePasser**: `0x4200000000000000000000000000000000000016` (Celo Sepolia)
- **Portal Contract**: `0x44ae3d41a335a7d05eb533029917aad35662dcc2` (Sepolia)

## Troubleshooting

- **"waiting-to-prove" status**: Wait up to 1 hour after withdrawal initiation
- **Private key format**: Ensure PK is provided without 0x prefix
