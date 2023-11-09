#!/usr/bin/env bash
set -euo pipefail

DATA_DIR=""

while getopts 'd:' flag; do
  case "${flag}" in
  d) DATA_DIR="${OPTARG}" ;;
  *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$DATA_DIR" ] && echo "Need to set the datadir path via the -d flag" && exit 1;

yarn run ganache \
  --detach \
  --wallet.mnemonic='concert load couple harbor equip island argue ramp clarify fence smart topic' \
  --miner.defaultGasPrice=0 \
  --miner.blockGasLimit=20000000 \
  --wallet.defaultBalance=200000000 \
  --chain.networkId=1101 \
  --chain.allowUnlimitedContractSize=true \
  --chain.chainId=1 \
  --chain.hardfork='istanbul' \
  --database.dbPath=$DATA_DIR \
