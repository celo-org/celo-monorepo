#!/usr/bin/env bash

# Usage: register.sh [data dir] [geth dir]
DATA_DIR=${1:-"/tmp/e2e/group"}
FAUCET=${2:-"0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95"}
GETH_DIR=${3:-"/home/dimi/celo/celo-blockchain"}

mkdir -p ${DATA_DIR}/keystore

export VALIDATOR=`./bin/celotooljs.sh geth create-account -e local --data-dir ${DATA_DIR} --geth-dir ${GETH_DIR} --password "" | grep 0x | cut -f4 -d' '`
echo ${VALIDATOR}
ACCOUNT_NOZEROX=`echo ${VALIDATOR} | cut -c 3-`
export KEYSTORE_V=`find ${DATA_DIR} -type f -iname "*${ACCOUNT_NOZEROX}"`
echo ${KEYSTORE_V}

FROM=${FAUCET} TO=${VALIDATOR} AMOUNT=3e22 ts-node src/helpers/transfer.ts

export VALIDATORGROUP=`./bin/celotooljs.sh geth create-account -e local --data-dir ${DATA_DIR} --geth-dir ${GETH_DIR} --password "" | grep 0x | cut -f4 -d' '`
echo ${VALIDATORGROUP}
ACCOUNT_NOZEROX=`echo ${VALIDATORGROUP} | cut -c 3-`
export KEYSTORE_VG=`find ${DATA_DIR} -type f -iname "*${ACCOUNT_NOZEROX}"`
echo ${KEYSTORE_VG}

FROM=${FAUCET} TO=${VALIDATORGROUP} AMOUNT=3e22 ts-node src/helpers/transfer.ts

KEYSTORE=${KEYSTORE_V} ts-node src/helpers/account_register.ts
KEYSTORE=${KEYSTORE_VG} ts-node src/helpers/account_register.ts

KEYSTORE=${KEYSTORE_VG} ts-node src/helpers/validatorgroup_register.ts
KEYSTORE=${KEYSTORE_V} GROUP=${VALIDATORGROUP} ts-node src/helpers/validator_register.ts
KEYSTORE=${KEYSTORE_VG} MEMBER=${VALIDATOR} ts-node src/helpers/validatorgroup_add.ts
KEYSTORE=${KEYSTORE_VG} GROUP=${VALIDATORGROUP} ts-node src/helpers/validatorgroup_vote.ts
KEYSTORE=${KEYSTORE_V} GROUP=${VALIDATORGROUP} ts-node src/helpers/validatorgroup_vote.ts
