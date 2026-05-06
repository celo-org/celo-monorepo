#!/usr/bin/env bash
set -euo pipefail

### this script is a example of how to run an anvil simulation for testing

NODE=https://forno.celo.org

killall anvil || true

ANVIL_PORT=8545

anvil --celo --fork-url $NODE --auto-impersonate --port $ANVIL_PORT &

while ! nc -z localhost $ANVIL_PORT; do
  sleep 0.1 # wait for 1/10 of the second before check again
done

DEFAULT_SIGNER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
GOVERNANCE_CONTRACT=0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972
EPOCH_REWARDS=0x07F007d389883622Ef8D4d347b3f78007f28d8b7


echo "Impersonating governance contract $GOVERNANCE_CONTRACT"
cast send $EPOCH_REWARDS "setTargetValidatorEpochPayment(uint256 value)" 0 --from $GOVERNANCE_CONTRACT --unlocked

echo "Check if target is lowered to 0"
cast call $EPOCH_REWARDS "targetValidatorEpochPayment() returns (uint256)"

cast rpc evm_increaseTime 86400
cast rpc evm_mine


celocli epochs:switch --from $DEFAULT_SIGNER -n http://localhost:8545
