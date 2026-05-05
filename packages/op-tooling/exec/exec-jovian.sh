#!/usr/bin/env bash
set -euo pipefail

# parse version argument
VERSION=${1:?Usage: $0 <v4|v5|succ-v2>}
case $VERSION in
  "v4"|"v5"|"succ-v2") ;;
  *) echo "Usage: $0 <v4|v5|succ-v2>" && exit 1 ;;
esac

# get repo root
REPO_ROOT=$(git rev-parse --show-toplevel)

# determine signer file for requested version
case $VERSION in
  "v4") SIGNER_FILE="$REPO_ROOT/secrets/.env.signers.v4" ;;
  "v5") SIGNER_FILE="$REPO_ROOT/secrets/.env.signers.v5" ;;
  "succ-v2") SIGNER_FILE="$REPO_ROOT/secrets/.env.signers.succinct200" ;;
esac

# required decoded signer file
[ ! -f "$SIGNER_FILE" ] && echo "Need to decode $(basename $SIGNER_FILE).enc first" && exit 1;

# load decoded signers
source "$SIGNER_FILE"

# required envs
[ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
echo "Logged in as wallet: $(cast wallet address --private-key $PK)"

# optional envs
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

# safes (mainnet)
PARENT_SAFE_ADDRESS=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_SAFE_ADDRESS=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_SAFE_ADDRESS=0xC03172263409584f7860C25B6eB4985f0f6F4636

# cLabs signers (6-of-8, sorted ascending by address)
CLABS_SIGNERS=(0Bd 21e 4D8 74b 812 8b4)

for ID in "${CLABS_SIGNERS[@]}"; do
  eval "CLABS_SIGNER_${ID}=\${CLABS_SIGNER_${ID}__ADDRESS}"
  eval "CLABS_SIGNER_${ID}_SIG=\${CLABS_SIGNER_${ID}__SIG}"
done

# council signers (6-of-8, sorted ascending by address)
COUNCIL_SIGNERS=(148 2BE 5f7 6FD B96 C91)

for ID in "${COUNCIL_SIGNERS[@]}"; do
  eval "COUNCIL_SIGNER_${ID}=\${COUNCIL_SIGNER_${ID}__ADDRESS}"
  eval "COUNCIL_SIGNER_${ID}_SIG=\${COUNCIL_SIGNER_${ID}__SIG}"
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
  # params
  VERSION=$1

  # check version
  case $VERSION in
    "v4"|"v5"|"succ-v2")
      echo "Detected supported version: $VERSION"
      ;;
    *)
      echo "Invalid version: $VERSION" && exit 1
      ;;
  esac

  # tx data
  # @dev For v4 & v5: OPCM upgrade calldata
  # bytes4(keccak256(abi.encodePacked("upgrade((address,address,bytes32)[],bool)"))) = 0xa4589780
  # @dev For succ-v2: Multicall3 aggregate3 calldata
  # bytes4(keccak256(abi.encodePacked("aggregate3((address,bool,bytes)[])"))) = 0x82ad56cb
  if [ "$VERSION" = "v4" ]; then
    PARENT_SAFE_NONCE=26
    CLABS_SAFE_NONCE=24
    COUNCIL_SAFE_NONCE=26
    TARGET_ADDRESS=0x5fe49eb068a4e3c52255e1f3c1273be331262842
    CALLDATA=0xa458978000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000089e31965d844a309231b1f17759ccaf1b7c09861000000000000000000000000783a434532ee94667979213af1711505e8bfe37403eb07101fbdeaf3f04d9fb76526362c1eea2824e4c6e970bdb19675b72e4fc8
  elif [ "$VERSION" = "v5" ]; then
    PARENT_SAFE_NONCE=27
    CLABS_SAFE_NONCE=25
    COUNCIL_SAFE_NONCE=27
    TARGET_ADDRESS=0x503c51b8de2bc78d5f83c179b786b2aa1c454635
    CALLDATA=0xa458978000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000089e31965d844a309231b1f17759ccaf1b7c09861000000000000000000000000783a434532ee94667979213af1711505e8bfe37403caa1871bb9fe7f9b11217c245c16e4ded33367df5b3ccb2c6d0a847a217d1b
  elif [ "$VERSION" = "succ-v2" ]; then
    PARENT_SAFE_NONCE=28
    CLABS_SAFE_NONCE=26
    COUNCIL_SAFE_NONCE=28
    TARGET_ADDRESS=0xcA11bde05977b3631167028862bE2a173976CA11
    # call 1: setImplementation(42, 0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1) on DisputeGameFactory
    # call 2: transferOwnership(0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d) on SystemConfig
    CALLDATA=0x82ad56cb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000FbAC162162f4009Bb007C6DeBC36B1dAC10aF68300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004414f6b1a3000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000E7bd695d6A17970A2D9dB55cfeF7F2024d630aE10000000000000000000000000000000000000000000000000000000000000000000000000000000089E31965D844a309231B1f17759Ccaf1b7c09861000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000024f2fde38b0000000000000000000000009Eb44Da23433b5cAA1c87e35594D15FcEb08D34d00000000000000000000000000000000000000000000000000000000
  fi

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

  # council sig (6-of-8 ECDSA)
  COUNCIL_SIG="0x"
  for ID in "${COUNCIL_SIGNERS[@]}"; do
    sig_var="COUNCIL_SIGNER_${ID}_SIG"
    sig_val="${!sig_var}"
    COUNCIL_SIG+="${sig_val:2}"
  done
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

  # clabs sig (6-of-8 ECDSA)
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
  # sorted by address: cLabs (0x9Eb...) < Council (0xC03...)
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

echo "--------- $(echo $VERSION | tr '[:lower:]' '[:upper:]') ---------"
performUpgrade "$VERSION"
echo "--------- EOF ---------"
