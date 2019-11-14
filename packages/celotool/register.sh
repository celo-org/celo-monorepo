#!/usr/bin/env bash

# Usage: register.sh [data dir] [geth dir]
TYPE=${1:-"account"}
DATA_DIR=${2:-"/tmp/e2e/group"}
FAUCET=${3:-"0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95"}
GETH_DIR=${4:-"/home/dimi/celo/celo-blockchain"}

mkdir -p ${DATA_DIR}/keystore

export ACCOUNT=`./bin/celotooljs.sh geth create-account -e local --data-dir ${DATA_DIR} --geth-dir ${GETH_DIR} --password "" | grep 0x | cut -f4 -d' '`
echo ${ACCOUNT}

ACCOUNT_NOZEROX=`echo ${ACCOUNT} | cut -c 3-`
export KEYSTORE=`find ${DATA_DIR} -type f -iname "*${ACCOUNT_NOZEROX}"`
echo ${KEYSTORE}

FROM=${FAUCET} TO=${ACCOUNT} AMOUNT=3e22 ts-node src/helpers/transfer.ts

ts-node src/helpers/account_register.ts
case "${TYPE}" in
"group") ts-node src/helpers/validatorgroup_register.ts
    ;;
"val") ts-node src/helpers/validator_register.ts
    ;;
esac