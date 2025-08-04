# Building Proofs for Withdrawals

This package is part of the Optimism L2-to-L1 message-passer pipeline, utilizing [Viem](https://viem.sh/) for Ethereum interactions. It is responsible for building cryptographic proofs required to prove withdrawals from Optimism L2 to Ethereum L1.

## Overview

When withdrawing assets from Optimism L2 to Ethereum L1, a proof must be generated to verify the withdrawal transaction on L1. This package automates the process of building such proofs, which are then submitted to the L1 contracts for finalization.

## Setup

Install dependencies using Yarn:

```sh
yarn install
```

## Building Proofs

To build a proof for a withdrawal, run the following command with the required environment variables:

```sh
PK=... TX_HASH=... yarn build
```

- `PK`: The private key of the account initiating withdrawal.
- `TX_HASH`: The transaction hash of the withdrawal on L2.

The script will fetch the necessary data from Optimism L2, construct the proof, and output the result for submission to L1.
