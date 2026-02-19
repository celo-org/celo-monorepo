#!/usr/bin/env bash
set -euo pipefail

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${OP_ROOT:-}" ] && echo "Need to set the OP_ROOT via env" && exit 1;

# Check network
case $NETWORK in
  "sepolia"|"mainnet")
    echo "Detected supported network: $NETWORK"
    ;;
  *)
    echo "Unsupported network! Choose from 'sepolia' or 'mainnet'" && exit 1
    ;;
esac

# Set vars
OP_DEPLOYER_CMD="$OP_ROOT/op-deployer/bin/op-deployer"
ARTIFACTS_LOCATOR="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts"
CONFIG=./config-upgrade.json
if [[ -z "${RPC_URL:-}" ]]; then
  L1_RPC_URL=http://localhost:8545
  echo "Using localhost"
else
  L1_RPC_URL=$RPC_URL
  echo "Using rpc: $L1_RPC_URL"
fi

###################
# OP-DEPLOYER CMD #
###################

# USAGE: op-deployer upgrade <version> [command options]
# OPTIONS:
#    --l1-rpc-url value              RPC URL for the L1 chain. Must be set for live chains. Must be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --config value                  path to the config file
#    --override-artifacts-url value  override the artifacts URL
#    --outfile value                 path to write the output to, or - for stdout (default: "-")
#    --log.level value               The lowest log level that will be output (default: INFO) [$DEPLOYER_LOG_LEVEL]
#    --log.format value              Format the log output. Supported formats: 'text', 'terminal', 'logfmt', 'json', 'json-pretty', (default: text) [$DEPLOYER_LOG_FORMAT]
#    --log.color                     Color the log output if in terminal mode (default: false) [$DEPLOYER_LOG_COLOR]
#    --log.pid                       Show pid in the log (default: false) [$DEPLOYER_LOG_PID]

echo "Performing upgrade to v5.0.0 for $NETWORK!"
$OP_DEPLOYER_CMD upgrade v5.0.0 \
  --l1-rpc-url="$L1_RPC_URL" \
  --config="$CONFIG" \
  --override-artifacts-url="$ARTIFACTS_LOCATOR"
