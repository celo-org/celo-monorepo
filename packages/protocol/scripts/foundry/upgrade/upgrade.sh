#!/usr/bin/env bash
set -euo pipefail

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "$DEPLOYER_PK" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

OP_DEPLOYER_CMD="$OP_ROOT/op-deployer/bin/op-deployer"

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

L1_RPC_URL=http://localhost:8545
ARTIFACTS_LOCATOR="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts"
CONFIG=./scripts/foundry/upgrade/config-upgrade.json

echo "Performing upgrade to $VERSION for $NETWORK!"
$OP_DEPLOYER_CMD upgrade $VERSION \
  --l1-rpc-url="$L1_RPC_URL" \
  --config="$CONFIG" \
  --override-artifacts-url="$ARTIFACTS_LOCATOR" \
  --private-key=$DEPLOYER_PK
