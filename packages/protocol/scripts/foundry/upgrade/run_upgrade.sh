#!/usr/bin/env bash
set -euo pipefail

# Orchestrates the upgrade scripts to perform Optimism Upgrade 13, updating L1 contracts to 2.0.0.

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;

export VERSION=v2.0.0
# Safe to share: private key of first default Anvil account
export DEPLOYER_PK=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

if [ "${NETWORK}" == "alfajores" ]; then
    export MULTISIG_ADDRESS=0xf05f102e890E713DC9dc0a5e13A8879D5296ee48
elif [ "${NETWORK}" == "baklava" ]; then
    export MULTISIG_ADDRESS=0xd542f3328ff2516443FE4db1c89E427F67169D94
else
  echo "Unsupported network! Choose from 'alfajores' or 'baklava'"
  exit 1
fi

./scripts/foundry/upgrade/bootstrap.sh
./scripts/foundry/upgrade/bootstrap-validator.sh
./scripts/foundry/upgrade/upgrade.sh
