#!/usr/bin/env bash
set -euo pipefail

# behaviour (values: 'approve', 'sign')
APPROVE_OR_SIGN='sign'

# optionally allow to specify signer
EXTERNAL_SIG=${SIG:-}
EXTERNAL_ACCOUNT=${ACCOUNT:-}
EXTERNAL_TEAM=${TEAM:-}
GRAND_CHILD_MULTISIG=${GC_MULTISIG:-}
if [ -n "$EXTERNAL_SIG" ] && [ -n "$EXTERNAL_ACCOUNT" ]; then
  echo "Detected external account: $EXTERNAL_ACCOUNT"
  case $EXTERNAL_TEAM in
    "clabs"|"council")
      echo "Detected valid team: $EXTERNAL_TEAM"
      ;;
    *)
      echo "Invalid team: $EXTERNAL_TEAM" && exit 1
      ;;
  esac
  echo "External sig: $EXTERNAL_SIG"
fi
if [ -n "$GRAND_CHILD_MULTISIG" ] && [ "$EXTERNAL_TEAM" != "council" ]; then
  echo "Grand Child multisig is not supported for other team than council" && exit 1
fi

# required envs
[ -z "${VERSION:-}" ] && echo "Need to set the VERSION via env" && exit 1;
[ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
[ -z "${SENDER:-}" ] && echo "Need to set the SENDER via env" && exit 1;
if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "clabs" ]; then
  [ -z "${SIGNER_1_PK:-}" ] && echo "Need to set the SIGNER_1_PK via env" && exit 1;
fi
[ -z "${SIGNER_2_PK:-}" ] && echo "Need to set the SIGNER_2_PK via env" && exit 1;
if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "council" ]; then
  [ -z "${SIGNER_3_PK:-}" ] && echo "Need to set the SIGNER_3_PK via env" && exit 1;
fi
[ -z "${SIGNER_4_PK:-}" ] && echo "Need to set the SIGNER_4_PK via env" && exit 1;

# check version
case $VERSION in
  "v2"|"v3"|"succinct")
    echo "Detected supported version: $VERSION"
    ;;
  *)
    echo "Invalid version: $VERSION" && exit 1
    ;;
esac

# addresses
if [ $SENDER != $(cast wallet address --private-key $PK) ]; then
  echo "Invalid PK"; exit 1;
fi
if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "clabs" ]; then
  # if EXTERNAL_SIG & EXTERNAL_ACCOUNT are set and EXTERNAL_TEAM is clabs than MOCKED_SIGNER_1 = EXTERNAL_ACCOUNT
  MOCKED_SIGNER_1=$(cast wallet address --private-key $SIGNER_1_PK)
fi
MOCKED_SIGNER_2=$(cast wallet address --private-key $SIGNER_2_PK)
if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "council" ]; then
  # if EXTERNAL_SIG & EXTERNAL_ACCOUNT are set and EXTERNAL_TEAM is council than MOCKED_SIGNER_3 = EXTERNAL_ACCOUNT
  MOCKED_SIGNER_3=$(cast wallet address --private-key $SIGNER_3_PK)
fi
MOCKED_SIGNER_4=$(cast wallet address --private-key $SIGNER_4_PK)

# rpc
RPC_URL=http://127.0.0.1:8545

# defaults
VALUE=0
OP_CALL=0
OP_DELEGATECALL=1
SAFE_TX_GAS=0
BASE_GAS=0
GAS_PRICE=0
GAS_TOKEN=0x0000000000000000000000000000000000000000
REFUND_RECEIVER=0x0000000000000000000000000000000000000000

# safes
PARENT_SAFE_ADDRESS=0x4092A77bAF58fef0309452cEaCb09221e556E112
CLABS_SAFE_ADDRESS=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
COUNCIL_SAFE_ADDRESS=0xC03172263409584f7860C25B6eB4985f0f6F4636

# tx data
# @dev TX_CALLDATA is the calldata for performing the tx...
# ...for v2 & v3:
# ...it was generated during last step of interaction with op-deployer (op-deployer upgrade)
# ...bytes4(keccak256(abi.encodePacked("upgrade((address,address,bytes32)[],bool)"))) = 0xa4589780
# ...for succinct:
# ...it was generated via interaction between safe & multicall contract (multicall aggregate3)
# ...bytes4(keccak256(abi.encodePacked("aggregate3((address,bool,bytes)[])"))) = 0x82ad56cb
if [ "$VERSION" = "v2" ]; then
  PARENT_SAFE_NONCE=22
  CLABS_SAFE_NONCE=19
  COUNCIL_SAFE_NONCE=21
  TARGET=0x597f110a3bee7f260b1657ab63c36d86b3740f36
  TX_CALLDATA=0xa458978000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000089e31965d844a309231b1f17759ccaf1b7c09861000000000000000000000000783a434532ee94667979213af1711505e8bfe37403b357b30095022ecbb44ef00d1de19df39cf69ee92a60683a6be2c6f8fe6a3e
elif [ "$VERSION" = "v3" ]; then
  PARENT_SAFE_NONCE=23
  CLABS_SAFE_NONCE=20
  COUNCIL_SAFE_NONCE=22
  TARGET=0x2e8cd74af534f5eeb53f889d92fd4220546a15e7
  TX_CALLDATA=0xa458978000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000089e31965d844a309231b1f17759ccaf1b7c09861000000000000000000000000783a434532ee94667979213af1711505e8bfe374034b32d11f017711ce7122ac71d87b1c6cc73e10a0dbd957d8b27f6360acaf8f
elif [ "$VERSION" = "succinct" ]; then
  PARENT_SAFE_NONCE=24
  CLABS_SAFE_NONCE=21
  COUNCIL_SAFE_NONCE=23
  TARGET=0xcA11bde05977b3631167028862bE2a173976CA11
  TX_CALLDATA=0x82ad56cb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000fbac162162f4009bb007c6debc36b1dac10af6830000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000441e334240000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000011c37937e08000000000000000000000000000000000000000000000000000000000000000000000000000000000000fbac162162f4009bb007c6debc36b1dac10af68300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004414f6b1a3000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000113f434f82ff82678ae7f69ea122791fe1f6b73e00000000000000000000000000000000000000000000000000000000
fi

echo "--- Parent prep ---"

# parent hash
PARENT_TX_HASH=$(cast call $PARENT_SAFE_ADDRESS \
  "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
  $TARGET $VALUE $TX_CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SAFE_NONCE \
  -r $RPC_URL
)
echo "Parent hash: $PARENT_TX_HASH"

echo "--- cLabs part ---"

# cLabs approve
APPROVE_ON_PARENT_CALLDATA=$(cast calldata 'approveHash(bytes32)' $PARENT_TX_HASH)
CLABS_TX_HASH=$(cast call $CLABS_SAFE_ADDRESS \
  "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
  $PARENT_SAFE_ADDRESS $VALUE $APPROVE_ON_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $CLABS_SAFE_NONCE \
  -r $RPC_URL
)
echo "cLabs hash: $CLABS_TX_HASH"

# approve or sign cLabs
if [ "$APPROVE_OR_SIGN" = "approve" ]; then
  echo "Approve cLabs hash"
  CLABS_APPROVE_FROM_SIGNER_CALLDATA=$(cast calldata 'approveHash(bytes32)' $CLABS_TX_HASH)
  cast send $CLABS_SAFE_ADDRESS $CLABS_APPROVE_FROM_SIGNER_CALLDATA --private-key $SIGNER_1_PK -r $RPC_URL
  cast send $CLABS_SAFE_ADDRESS $CLABS_APPROVE_FROM_SIGNER_CALLDATA --private-key $SIGNER_2_PK -r $RPC_URL
  echo "cLabs hash approved"
else
  echo "Sign cLabs hash"
  if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "clabs" ]; then
    CLABS_SIG_1=$(cast wallet sign --no-hash $CLABS_TX_HASH --private-key $SIGNER_1_PK)
  else
    CLABS_SIG_1=$EXTERNAL_SIG
  fi
  echo "Sig 1: $CLABS_SIG_1"
  CLABS_SIG_2=$(cast wallet sign --no-hash $CLABS_TX_HASH --private-key $SIGNER_2_PK)
  echo "Sig 2: $CLABS_SIG_2"
  echo "cLabs hash signed"
fi

# exec cLabs
echo "Exec cLabs approval"
if [ $APPROVE_OR_SIGN = 'approve' ]; then
  # signature in format where signer is nested safe (https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L349C17-L351C94)
  CLABS_SIG=0x000000000000000000000000${MOCKED_SIGNER_2:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${MOCKED_SIGNER_1:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
else
  if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "clabs" ]; then
    CLABS_SIG=0x${CLABS_SIG_2:2}${CLABS_SIG_1:2}
  elif [[ ${MOCKED_SIGNER_2:2} < ${EXTERNAL_ACCOUNT:2} ]]; then
    CLABS_SIG=0x${CLABS_SIG_2:2}${EXTERNAL_SIG:2}
  else
    CLABS_SIG=0x${EXTERNAL_SIG:2}${CLABS_SIG_2:2}
  fi
fi
echo "cLabs sig: $CLABS_SIG"
cast send $CLABS_SAFE_ADDRESS \
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
  $PARENT_SAFE_ADDRESS $VALUE $APPROVE_ON_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $CLABS_SIG \
  --private-key $PK \
  -r $RPC_URL
echo "cLabs approval executed"

echo "--- Council part ---"

# Council approve
COUNCIL_TX_HASH=$(cast call $COUNCIL_SAFE_ADDRESS \
  "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
  $PARENT_SAFE_ADDRESS $VALUE $APPROVE_ON_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $COUNCIL_SAFE_NONCE \
  -r $RPC_URL
)
echo "Council hash: $COUNCIL_TX_HASH"

# approve or sign Council
if [ -n "$GRAND_CHILD_MULTISIG" ]; then
  echo "Detected Grand Child multisig: $GRAND_CHILD_MULTISIG"

  GRAND_CHILD_NONCE=$(cast call $GRAND_CHILD_MULTISIG "nonce()(uint256)" -r $RPC_URL)
  echo "Grand Child nonce: $GRAND_CHILD_NONCE"

  APPROVE_ON_CHILD_CALLDATA=$(cast calldata 'approveHash(bytes32)' $COUNCIL_TX_HASH)
  GRAND_CHILD_TX_HASH=$(cast call $GRAND_CHILD_MULTISIG \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_ON_CHILD_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $GRAND_CHILD_NONCE \
    -r $RPC_URL
  )
  echo "Grand Child hash: $GRAND_CHILD_TX_HASH"
  echo "Grand Child sig: $EXTERNAL_SIG"
  cast send $GRAND_CHILD_MULTISIG \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    $COUNCIL_SAFE_ADDRESS $VALUE $APPROVE_ON_CHILD_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $EXTERNAL_SIG \
    --private-key $PK \
    -r $RPC_URL
  echo "Grand Child approval executed"
fi

if [ "$APPROVE_OR_SIGN" = "approve" ]; then
  echo "Approve Council hash"
  COUNCIL_APPROVE_FROM_SIGNER_CALLDATA=$(cast calldata 'approveHash(bytes32)' $COUNCIL_TX_HASH)
  cast send $COUNCIL_SAFE_ADDRESS $COUNCIL_APPROVE_FROM_SIGNER_CALLDATA --private-key $SIGNER_3_PK -r $RPC_URL
  cast send $COUNCIL_SAFE_ADDRESS $COUNCIL_APPROVE_FROM_SIGNER_CALLDATA --private-key $SIGNER_4_PK -r $RPC_URL
  echo "Council hash approved"
else
  echo "Sign Council hash"
  if [ -z "$GRAND_CHILD_MULTISIG" ]; then
    if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "council" ]; then
      COUNCIL_SIG_1=$(cast wallet sign --no-hash $COUNCIL_TX_HASH --private-key $SIGNER_3_PK)
    else
      COUNCIL_SIG_1=$EXTERNAL_SIG
    fi
    echo "Sig 1: $COUNCIL_SIG_1"
  fi
  COUNCIL_SIG_2=$(cast wallet sign --no-hash $COUNCIL_TX_HASH --private-key $SIGNER_4_PK)
  echo "Sig 2: $COUNCIL_SIG_2"
  echo "Council hash signed"
fi

# exec Council
echo "Exec Council approval"
if [ "$APPROVE_OR_SIGN" = "approve" ]; then
  # signature in format where signer is nested safe (https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L349C17-L351C94)
  COUNCIL_SIG=0x000000000000000000000000${MOCKED_SIGNER_4:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${MOCKED_SIGNER_3:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
else
  if [ -z "$GRAND_CHILD_MULTISIG" ]; then
    if [ -z "$EXTERNAL_SIG" ] || [ -z "$EXTERNAL_ACCOUNT" ] || [ "$EXTERNAL_TEAM" != "council" ]; then
      COUNCIL_SIG=0x${COUNCIL_SIG_2:2}${COUNCIL_SIG_1:2}
    elif [[ ${MOCKED_SIGNER_4:2} < ${EXTERNAL_ACCOUNT:2} ]]; then
      COUNCIL_SIG=0x${COUNCIL_SIG_2:2}${EXTERNAL_SIG:2}
    else
      COUNCIL_SIG=0x${EXTERNAL_SIG:2}${COUNCIL_SIG_2:2}
    fi
  else
    COUNCIL_SIG=0x${COUNCIL_SIG_2:2}000000000000000000000000${GRAND_CHILD_MULTISIG:2}000000000000000000000000000000000000000000000000000000000000000001
  fi
fi
echo "Council sig: $COUNCIL_SIG"
cast send $COUNCIL_SAFE_ADDRESS \
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
  $PARENT_SAFE_ADDRESS $VALUE $APPROVE_ON_PARENT_CALLDATA $OP_CALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $COUNCIL_SIG \
  --private-key $PK \
  -r $RPC_URL
echo "Council approval executed"

echo "--- Parent exec ---"

# exec parent tx
echo "Exec tx"
# signature in format where signer is nested safe (https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L349C17-L351C94)
PARENT_SIG=0x000000000000000000000000${CLABS_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${COUNCIL_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
echo "Parent sig: $PARENT_SIG"
cast send $PARENT_SAFE_ADDRESS \
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
  $TARGET $VALUE $TX_CALLDATA $OP_DELEGATECALL $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER $PARENT_SIG \
  --gas-limit 16000000 \
  --private-key $PK \
  -r $RPC_URL
echo "Tx executed"
