#!/usr/bin/env bash
set -euo pipefail

# get repo root
REPO_ROOT=$(git rev-parse --show-toplevel)

# required decoded files
[ ! -f "$REPO_ROOT/secrets/.env.signers.succinct" ] && echo "Need to decode .env.signers.succinct.enc first" && exit 1;

# load decoded signers
source "$REPO_ROOT/secrets/.env.signers.succinct"

# required envs
[ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
echo "Logged in as wallet: $(cast wallet address --private-key $PK)"

# optional envs
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

# safes
PARENT_SAFE_ADDRESS=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_SAFE_ADDRESS=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_SAFE_ADDRESS=0xC03172263409584f7860C25B6eB4985f0f6F4636
GC_SAFE_ADDRESS=0xD1C635987B6Aa287361d08C6461491Fa9df087f2

# signer IDs (sorted by addresses)
CLABS_SIGNERS=(09C 21E 481 4D8 8B4 E00)
COUNCIL_SIGNERS=(148 5F7 6FD B96 D0C)
GC_D1C_SIGNERS=(C96 D80)

# dynamically load signers from sourced env vars
for ID in "${CLABS_SIGNERS[@]}"; do
  eval "CLABS_SIGNER_${ID}=\${CLABS_SIGNER_${ID}__ADDRESS}"
  eval "CLABS_SIGNER_${ID}_SIG=\${CLABS_SIGNER_${ID}__SIG}"
done

for ID in "${COUNCIL_SIGNERS[@]}"; do
  eval "COUNCIL_SIGNER_${ID}=\${COUNCIL_SIGNER_${ID}__ADDRESS}"
  eval "COUNCIL_SIGNER_${ID}_SIG=\${COUNCIL_SIGNER_${ID}__SIG}"
done

for ID in "${GC_D1C_SIGNERS[@]}"; do
  eval "GC_D1C_SIGNER_${ID}=\${GC_D1C_SIGNER_${ID}__ADDRESS}"
  eval "GC_D1C_SIGNER_${ID}_SIG=\${GC_D1C_SIGNER_${ID}__SIG}"
done

# defaults
VALUE=0
OP_CALL=0
OP_DELEGATECALL=1
SAFE_TX_GAS=0
BASE_GAS=0
GAS_PRICE=0
GAS_TOKEN=0x0000000000000000000000000000000000000000
REFUND_RECEIVER=0x95ffac468e37ddeef407ffef18f0cc9e86d8f13b

function performUpgrade() {
  # tx data
  # @dev CALLDATA is the calldata for performing the upgrade...
  # ...it was generated using ConfigureDeploymentSafe script (celo-org/op-succinct repo)
  # ...bytes4(keccak256(abi.encodePacked("aggregate3((address,bool,bytes)[])"))) = 0x82ad56cb
  PARENT_SAFE_NONCE=24
  CLABS_SAFE_NONCE=21
  COUNCIL_SAFE_NONCE=23
  GC_SAFE_NONCE=5
  TARGET_ADDRESS=0xcA11bde05977b3631167028862bE2a173976CA11
  CALLDATA=0x82ad56cb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000fbac162162f4009bb007c6debc36b1dac10af6830000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000441e334240000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000fbac162162f4009bb007c6debc36b1dac10af68300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004414f6b1a3000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000113f434f82ff82678ae7f69ea122791fe1f6b73e00000000000000000000000000000000000000000000000000000000

  echo "--- Parent prep ---"

  # parent hash
  PARENT_TX_HASH=$(cast call $PARENT_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $TARGET_ADDRESS $VALUE $CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SAFE_NONCE \
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

  echo "--- Grand child part ---"

  # gc hash
  APPROVE_COUNCIL_CALLDATA=$(cast calldata 'approveHash(bytes32)' $COUNCIL_TX_HASH)
  GC_TX_HASH=$(cast call $GC_SAFE_ADDRESS \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_COUNCIL_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $GC_SAFE_NONCE \
    -r $RPC_URL
  )
  echo "Grand child hash: $GC_TX_HASH"

  # gc sig
  GC_SIG="0x"
  for ID in "${GC_D1C_SIGNERS[@]}"; do
    sig_var="GC_D1C_SIGNER_${ID}_SIG"
    sig_val="${!sig_var}"
    GC_SIG+="${sig_val:2}"
  done
  echo "Grand child sig: $GC_SIG"

  echo "--- Grand child exec ---"

  # gc exec
  cast send $GC_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_COUNCIL_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $GC_SIG \
    --private-key $PK \
    -r $RPC_URL
  echo "Grand child executed"

  echo "--- Grand child done ---"

  # council sig
  COUNCIL_SIG="0x"
  for ID in "${COUNCIL_SIGNERS[@]}"; do
    sig_var="COUNCIL_SIGNER_${ID}_SIG"
    sig_val="${!sig_var}"
    COUNCIL_SIG+="${sig_val:2}"
  done
  COUNCIL_SIG+="000000000000000000000000${GC_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001"
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
  CLABS_SIG="0x"
  for ID in "${CLABS_SIGNERS[@]}"; do
    sig_var="CLABS_SIGNER_${ID}_SIG"
    sig_val="${!sig_var}"
    CLABS_SIG+="${sig_val:2}"
  done
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
  echo "Exec upgrade"
  # signature in format where signer is nested safe (https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L349C17-L351C94)
  PARENT_SIG=0x000000000000000000000000${CLABS_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${COUNCIL_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
  echo "Parent sig: $PARENT_SIG"
  cast send $PARENT_SAFE_ADDRESS \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $TARGET_ADDRESS $VALUE $CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SIG \
    --gas-limit 16000000 \
    --private-key $PK \
    -r $RPC_URL
  echo "Upgrade executed"

  echo "--- Parent done ---"
}

performUpgrade
