#!/usr/bin/env bash
set -euo pipefail

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "$DEPLOYER_PK" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

VERSION=v2.0.0

# USAGE: op-deployer upgrade <version> [command options]
# OPTIONS:
#    --l1-rpc-url value              RPC URL for the L1 chain. Must be set for live chains. Can be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --deployment-target value       Where to deploy L1 contracts. Options: live, genesis, calldata, noop (default: "live") [$DEPLOYER_DEPLOYMENT_TARGET]
#    --private-key value             Private key of the deployer account. [$DEPLOYER_PRIVATE_KEY]
#    --config value                  path to the config file
#    --override-artifacts-url value  override the artifacts URL
#    --log.level value               The lowest log level that will be output (default: INFO) [$DEPLOYER_LOG_LEVEL]
#    --log.format value              Format the log output. Supported formats: 'text', 'terminal', 'logfmt', 'json', 'json-pretty', (default: text) [$DEPLOYER_LOG_FORMAT]
#    --log.color                     Color the log output if in terminal mode (default: false) [$DEPLOYER_LOG_COLOR]
#    --log.pid                       Show pid in the log (default: false) [$DEPLOYER_LOG_PID]
if [ "${NETWORK}" == "alfajores" ]; then
echo "Performing upgrade to $VERSION for Alfajores!"
op-deployer upgrade $VERSION \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --config="./scripts/foundry/upgrade/config-upgrade-alfajores.json" \
  --override-artifacts-url="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --private-key=$DEPLOYER_PK
elif [ "${NETWORK}" == "baklava" ]; then
echo "Performing upgrade to $VERSION for Baklava!"
op-deployer upgrade $VERSION \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --config="./scripts/foundry/upgrade/config-upgrade-baklava.json" \
  --override-artifacts-url="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --private-key=$DEPLOYER_PK
else
  echo "Unsupported network! Choose from 'alfajores' or 'baklava'"
fi
