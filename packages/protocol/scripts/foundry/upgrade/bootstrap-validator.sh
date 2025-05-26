#!/usr/bin/env bash
set -euo pipefail

[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "$DEPLOYER_PK" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

# USAGE: op-deployer bootstrap validator [command options]
# OPTIONS:
#    --l1-rpc-url value         RPC URL for the L1 chain. Must be set for live chains. Can be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --private-key value        Private key of the deployer account. [$DEPLOYER_PRIVATE_KEY]
#    --outfile value            Output file. Use - for stdout. (default: "-") [$DEPLOYER_OUTFILE]
#    --artifacts-locator value  Locator for artifacts. [$DEPLOYER_ARTIFACTS_LOCATOR]
#    --config value             Path to a JSON file [$DEPLOYER_CONFIG]
#    --use-interop              If true, deploy Interop implementations. (default: false) [$DEPLOYER_USE_INTEROP]
op-deployer bootstrap validator \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --artifacts-locator="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --config="./scripts/foundry/upgrade/config-validator.json" \
  --private-key=$DEPLOYER_PK
