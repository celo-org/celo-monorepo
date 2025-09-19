#!/bin/bash
set -euo pipefail

# Constants (on Sepolia for Celo Sepolia)
L1_OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2

# Required environment variables
WITHDRAWAL_NONCE=${WITHDRAWAL_NONCE:-}; [ -z "${WITHDRAWAL_NONCE:-}" ] && echo "Need to set the WITHDRAWAL_NONCE via env" && exit 1;
SENDER=${SENDER:-}; [ -z "${SENDER:-}" ] && echo "Need to set the SENDER via env" && exit 1;
RECIPIENT=${RECIPIENT:-}; [ -z "${RECIPIENT:-}" ] && echo "Need to set the RECIPIENT via env" && exit 1;
VALUE=${VALUE:-}; [ -z "${VALUE:-}" ] && echo "Need to set the VALUE via env" && exit 1;
GAME_INDEX=${GAME_INDEX:-}; [ -z "${GAME_INDEX:-}" ] && echo "Need to set the GAME_INDEX via env" && exit 1;
OUTPUT_ROOT_PROOF__VERSION=${OUTPUT_ROOT_PROOF__VERSION:-} && [ -z "${OUTPUT_ROOT_PROOF__VERSION:-}" ] && echo "Need to set the OUTPUT_ROOT_PROOF__VERSION via env" && exit 1;
OUTPUT_ROOT_PROOF__STATE_ROOT=${OUTPUT_ROOT_PROOF__STATE_ROOT:-} && [ -z "${OUTPUT_ROOT_PROOF__STATE_ROOT:-}" ] && echo "Need to set the OUTPUT_ROOT_PROOF__STATE_ROOT via env" && exit 1;
OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT=${OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT:-} && [ -z "${OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT:-}" ] && echo "Need to set the OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT via env" && exit 1;
OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH=${OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH:-} && [ -z "${OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH:-}" ] && echo "Need to set the OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH via env" && exit 1;
WITHDRAWAL_PROOF=${WITHDRAWAL_PROOF:-}; [ -z "${WITHDRAWAL_PROOF:-}" ] && echo "Need to set the WITHDRAWAL_PROOF via env" && exit 1;
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;

### Example value of WITHDRAWAL_PROOF:
# WITHDRAWAL_PROOF="[0xf8918080808080a0231eba9c2bc1784b944714d5260873e3f92b58434c1879123d58f995b342865180a0b3b0303113429f394c506a530c83a8fdbd3125d95b2310b05191cd2dbc978aa8808080a0236e8f61ecde6abfebc6c529441f782f62469d8a2cc47b7aace2c136bd3b1ff080a06babe3fe3879f4972e397c7e516ceb2699945beb318afa0ddee8e7381796f5ff808080,0xf8518080808080a0ea006b1384a4bf0219939e5483e6e82c22d13290d5055e2042541adfb1b47ec380808080a05aa8408d8bac30771c33c39b02167ad094fff70f16e4aa667623d999d04725c9808080808080,0xe2a02005084db35fe36c140bc6d2bc4d520dafa807b5e774c7276c91658a496f59cc01]"

# Optional environment variables
GAS_LIMIT=${GAS_LIMIT:-0}
DATA=${DATA:-"0x00"}
L1_RPC_URL=${RPC_URL:-}

# Optionally required environment variables
if [ -z "${L1_RPC_URL:-}" ]; then
  ALCHEMY_KEY=${ALCHEMY_KEY:-}; [ -z "${ALCHEMY_KEY:-}" ] && echo "Need to specify full RPC_URL or to set the ALCHEMY_KEY via env" && exit 1;
  L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY
fi

# Proves withdrawal transaction on L1
cast send $L1_OPTIMISM_PORTAL \
  "proveWithdrawalTransaction((uint256, address, address, uint256, uint256, bytes), uint256, (bytes32, bytes32, bytes32, bytes32), bytes[])" \
  "($WITHDRAWAL_NONCE,$SENDER,$RECIPIENT,$VALUE,$GAS_LIMIT,$DATA)" \
  $GAME_INDEX \
  "($OUTPUT_ROOT_PROOF__VERSION,$OUTPUT_ROOT_PROOF__STATE_ROOT,$OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT,$OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH)" \
  "$WITHDRAWAL_PROOF" \
  --private-key $PK \
  --rpc-url $L1_RPC_URL
