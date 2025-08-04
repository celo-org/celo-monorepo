# Building Proofs for Withdrawals

This package is part of the Optimism L2-to-L1 message-passer pipeline, utilizing [Viem](https://viem.sh/) for Ethereum interactions. It is responsible for building cryptographic proofs required to prove withdrawals from Optimism L2 to Ethereum L1.

## Overview

When withdrawing assets from Optimism L2 to Ethereum L1, a proof must be generated to verify the withdrawal transaction on L1. This package automates the process of building such proofs, which are then submitted to the L1 contracts for finalization.

## Setup

Install dependencies using Yarn:

```sh
yarn install
```

## Waiting time

It might take up to **1 hour** until building proof is possible.
When running script and receiving `waiting-to-prove` status - wait a bit and retry.
When `ready-to-prove` status appear, the script will output `Prove Args`.

## Building Proofs

To build a proof for a withdrawal, run the following command with the required environment variables:

```sh
PK=... TX_HASH=... yarn build
```

- `PK`: The private key of the account initiating withdrawal.
- `TX_HASH`: The transaction hash of the withdrawal on L2.

The script will fetch the necessary data from Optimism L2, construct the proof, and output the result for submission to L1.

## Example output of building proof

Ensure to save data (`l2OutputIndex`, `outputRootProof`, `withdrawalProof` & `withdrawal`) from `Prove Args`:
```sh
Receipt: {...}
Status: ready-to-prove
Output: {...}
Withdrawal: {...}
Prove Args: {
  l2OutputIndex: ...,
  outputRootProof: {
    latestBlockhash: ...,
    messagePasserStorageRoot: ...,
    stateRoot: ...,
    version: ...
  },
  withdrawalProof: [
    ...,
    ...
  ],
  withdrawal: {
    nonce: ...,
    sender: ...,
    target: ...,
    value: ...,
    gasLimit: ...,
    data: ...,
    withdrawalHash: ...
  }
}
```
