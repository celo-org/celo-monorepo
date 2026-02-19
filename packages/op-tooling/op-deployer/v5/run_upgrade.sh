#!/usr/bin/env bash
set -euo pipefail

# Orchestrates the upgrade scripts to perform desired Optimism Upgrade, updating L1 contracts to specified version.

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${OP_ROOT:-}" ] && echo "Need to set the OP_ROOT via env" && exit 1;

# Check network
if [ "${NETWORK}" == "sepolia" ]; then
  export MULTISIG_ADDRESS=0x5e60d897Cd62588291656b54655e98ee73f0aabF
elif [ "${NETWORK}" == "mainnet" ]; then
  export MULTISIG_ADDRESS=0x4092A77bAF58fef0309452cEaCb09221e556E112
else
  echo "Unsupported network! Choose from 'sepolia' or 'mainnet'"
  exit 1
fi

# Use specified rpc or fallback
if [[ -z "${RPC_URL:-}" ]]; then 
  export L1_RPC_URL=http://localhost:8545
  echo "Using localhost"
else
  export L1_RPC_URL=$RPC_URL
  echo "Using rpc: $L1_RPC_URL"
fi

# Use external pk or fallback
if [[ -z "${DEPLOYER_PK:-}" ]]; then
  # Safe to share: private key of first default Anvil account
  export DEPLOYER_PK=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  echo "Using deafult Anvil deployer"
fi

# Run all scripts synchronously
./bootstrap.sh
./upgrade.sh
