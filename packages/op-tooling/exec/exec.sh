#!/usr/bin/env bash
set -euo pipefail

# required envs
[ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
[ -z "${OPCM_ADDRESS:-}" ] && echo "Need to set the OPCM_ADDRESS via env" && exit 1;
[ -z "${OPCM_UPGRADE_CALLDATA:-}" ] && echo "Need to set the OPCM_UPGRADE_CALLDATA via env" && exit 1;
[ -z "${MENTO_SIG:-}" ] && echo "Need to set the MENTO_SIG via env" && exit 1;
[ -z "${COUNCIL_SIG:-}" ] && echo "Need to set the COUNCIL_SIG via env" && exit 1;
[ -z "${CLABS_SIG:-}" ] && echo "Need to set the CLABS_SIG via env" && exit 1;
echo "Logged in as wallet: $(cast wallet address --private-key $PK)"
echo "Detected OPCM under address: $OPCM_ADDRESS"
echo "Detected upgrade calldata: $OPCM_UPGRADE_CALLDATA"

# optional envs
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

# safes
PARENT_SAFE_ADDRESS=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_SAFE_ADDRESS=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_SAFE_ADDRESS=0xC03172263409584f7860C25B6eB4985f0f6F4636
MENTO_SAFE_ADDRESS=0xD1C635987B6Aa287361d08C6461491Fa9df087f2

# defaults
VALUE=0
OP_CALL=0
OP_DELEGATECALL=1
SAFE_TX_GAS=0
BASE_GAS=0
GAS_PRICE=0
GAS_TOKEN=0x0000000000000000000000000000000000000000
REFUND_RECEIVER=0x0000000000000000000000000000000000000000

function performUpgrade() {
  # fetch current nonces
  PARENT_SAFE_NONCE=$(cast call $PARENT_SAFE_ADDRESS "nonce()(uint256)" -r $RPC_URL)
  CLABS_SAFE_NONCE=$(cast call $CLABS_SAFE_ADDRESS "nonce()(uint256)" -r $RPC_URL)
  COUNCIL_SAFE_NONCE=$(cast call $COUNCIL_SAFE_ADDRESS "nonce()(uint256)" -r $RPC_URL)
  MENTO_SAFE_NONCE=$(cast call $MENTO_SAFE_ADDRESS "nonce()(uint256)" -r $RPC_URL)

  echo "--- Parent prep ---"

  # parent hash
  PARENT_TX_HASH=$(cast call $PARENT_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $OPCM_ADDRESS $VALUE $OPCM_UPGRADE_CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SAFE_NONCE \
    -r $RPC_URL
  )
  echo "Parent hash: $PARENT_TX_HASH"

  echo "--- Council part ---"

  # council hash
  APPROVE_PARENT_CALLDATA=$(cast calldata 'approveHash(bytes32)' $PARENT_TX_HASH)
  COUNCIL_TX_HASH=$(cast call $COUNCIL_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $PARENT_SAFE_ADDRESS $VALUE $APPROVE_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $COUNCIL_SAFE_NONCE \
    -r $RPC_URL
  )
  echo "Council hash: $COUNCIL_TX_HASH"

  echo "--- Mento part ---"

  # mento hash
  APPROVE_COUNCIL_CALLDATA=$(cast calldata 'approveHash(bytes32)' $COUNCIL_TX_HASH)
  MENTO_TX_HASH=$(cast call $MENTO_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_COUNCIL_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $MENTO_SAFE_NONCE \
    -r $RPC_URL
  )
  echo "Mento hash: $MENTO_TX_HASH"

  # mento sig
  echo "Mento sig: $MENTO_SIG"

  echo "--- Mento exec ---"

  # mento exec
  cast send $MENTO_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_COUNCIL_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $MENTO_SIG \
    --private-key $PK \
    -r $RPC_URL
  echo "Mento executed"

  echo "--- Mento done ---"

  # council sig
  echo "Council sig: $COUNCIL_SIG"

  echo "--- Council exec ---"

  # council exec
  cast send $COUNCIL_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $PARENT_SAFE_ADDRESS $VALUE $APPROVE_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $COUNCIL_SIG \
    --private-key $PK \
    -r $RPC_URL
  echo "Council executed"

  echo "--- Council done ---"

  echo "--- cLabs part ---"

  # clabs hash
  CLABS_TX_HASH=$(cast call $CLABS_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $PARENT_SAFE_ADDRESS $VALUE $APPROVE_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $CLABS_SAFE_NONCE \
    -r $RPC_URL
  )
  echo "cLabs hash: $CLABS_TX_HASH"

  # clabs sig
  echo "cLabs sig: $CLABS_SIG"

  echo "--- cLabs exec ---"

  # clabs exec
  cast send $CLABS_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $PARENT_SAFE_ADDRESS $VALUE $APPROVE_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $CLABS_SIG \
    --private-key $PK \
    -r $RPC_URL
  echo "cLabs executed"

  echo "--- cLabs done ---"

  echo "--- Parent exec ---"

  # exec parent tx
  echo "Exec OPCM upgrade"
  # signature in format where signer is nested safe (https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L349C17-L351C94)
  PARENT_SIG=0x000000000000000000000000${CLABS_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${COUNCIL_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
  echo "Parent sig: $PARENT_SIG"
  cast send $PARENT_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $OPCM_ADDRESS $VALUE $OPCM_UPGRADE_CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SIG \
    --gas-limit 16000000 \
    --private-key $PK \
    -r $RPC_URL
  echo "OPCM upgrade executed"

  echo "--- Parent done ---"
}

echo "--------- START ---------"
performUpgrade
echo "--------- END ---------"
