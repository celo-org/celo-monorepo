#!/usr/bin/env bash
set -euo pipefail

### Rehearses migrate_live_l2.sh on a local anvil shaped like the target chain's genesis: the Registry and
### the four fixed proxies owned by the deployer, the deployer and the unreleased treasury funded, and
### code at the OP-stack ProxyAdmin predeploy (which is how the contracts recognise an L2).
### All keys are throwaway ones generated here. Run it from packages/protocol.
###
### Optional env: MIGRATION_CONFIG (default ./migrations_sol/migrationsConfig.havoc.json), CHAIN_ID
### (default 33362320), PORT (default 8547), KEEP_ANVIL=1 to leave the chain running for inspection.

export MIGRATION_CONFIG=${MIGRATION_CONFIG:-./migrations_sol/migrationsConfig.havoc.json}
CHAIN_ID=${CHAIN_ID:-33362320}
PORT=${PORT:-8547}
export RPC_URL=http://127.0.0.1:$PORT
OWNER_SLOT=0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 # eip1967.proxy.admin
L2_PROXY_ADMIN=0x4200000000000000000000000000000000000018

mkdir -p .tmp
anvil --celo --chain-id $CHAIN_ID --port $PORT --block-time 1 --gas-limit 50000000 \
  --code-size-limit 65536 --balance 10000 >.tmp/rehearsal-anvil.log 2>&1 &
ANVIL_PID=$!
trap 'kill $ANVIL_PID 2>/dev/null || true' EXIT
sleep 3

new_key() { cast wallet new --json | jq -r '.[0].private_key'; }
export DEPLOYER_PRIVATE_KEY=$(new_key)
export DEPLOYER_ADDRESS=$(cast wallet address "$DEPLOYER_PRIVATE_KEY")
KEYS=()
for _ in 1 2 3 4 5 6 7 8 9; do KEYS+=("$(new_key)"); done
export VALIDATOR_KEYS=$(IFS=,; echo "${KEYS[*]}")
export VALIDATOR_SIGNERS_MNEMONIC=$(cast wallet new-mnemonic --words 24 --json | jq -r .mnemonic)
echo "rehearsal deployer: $DEPLOYER_ADDRESS"

# The proxy runtime is the same artifact the genesis allocation uses.
FOUNDRY_PROFILE=truffle-compat forge build >/dev/null
PROXY=$(jq -r '.deployedBytecode.object' out-truffle-compat/Proxy.sol/Proxy.json)
OWNER_VALUE=0x000000000000000000000000${DEPLOYER_ADDRESS#0x}
FCD_ADDRESS=$(jq -r .proxies.feeCurrencyDirectory $MIGRATION_CONFIG)
TREASURY=$(jq -r .proxies.celoUnreleasedTreasury $MIGRATION_CONFIG)
for ADDRESS in 0x000000000000000000000000000000000000ce10 $FCD_ADDRESS $TREASURY \
  $(jq -r '.proxies | .celoToken, .feeHandler' $MIGRATION_CONFIG); do
  cast rpc anvil_setCode $ADDRESS $PROXY --rpc-url $RPC_URL >/dev/null
  cast rpc anvil_setStorageAt $ADDRESS $OWNER_SLOT $OWNER_VALUE --rpc-url $RPC_URL >/dev/null
done
cast rpc anvil_setCode $L2_PROXY_ADMIN 0x00 --rpc-url $RPC_URL >/dev/null
CELO_500M=$(cast to-hex $(cast to-wei 500000000))
cast rpc anvil_setBalance $DEPLOYER_ADDRESS $CELO_500M --rpc-url $RPC_URL >/dev/null
cast rpc anvil_setBalance $TREASURY $CELO_500M --rpc-url $RPC_URL >/dev/null

./scripts/foundry/migrate_live_l2.sh
./scripts/foundry/live_l2/verify_core_contracts.sh $RPC_URL $DEPLOYER_ADDRESS $FCD_ADDRESS

if [ "${KEEP_ANVIL:-}" = 1 ]; then
  trap - EXIT
  echo "anvil (pid $ANVIL_PID) left running on $RPC_URL"
fi
