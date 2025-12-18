#!/usr/bin/env bash
set -euo pipefail

curl -X POST "https://gateway.holesky-safe.protofire.io/v1/chains/17000/transactions/$SAFE_ADDRESS/propose" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$OPCM_ADDRESS'",
    "value": "0",
    "data": "'$CALLDATA'",
    "operation": 1,
    "safeTxGas": "0",
    "baseGas": "0",
    "gasPrice": "0",
    "gasToken": "0x0000000000000000000000000000000000000000",
    "nonce": "'$NONCE'",
    "safeTxHash": "'$TX_HASH'",
    "sender": "'$SENDER'",
    "signature": "'$SIG'"
  }'
