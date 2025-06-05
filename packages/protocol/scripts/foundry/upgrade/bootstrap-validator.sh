#!/usr/bin/env bash
set -euo pipefail

[ -z "$VERSION" ] && echo "Need to set the VERSION via env" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "$DEPLOYER_PK" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

OP_DEPLOYER_CMD="$OP_ROOT/op-deployer/bin/op-deployer"

case $VERSION in
  "v2.0.0")
    echo "Detected supported version: $VERSION"
    TAG="v2"
    ;;
  "v3.0.0")
    echo "Detected supported version: $VERSION"
    TAG="v3"
    ;;
  *)
    echo "Invalid version: $VERSION" && exit 1
    ;;
esac

case $NETWORK in
  "alfajores"|"baklava")
    echo "Detected supported network: $NETWORK"
    ;;
  *)
    echo "Unsupported network! Choose from 'alfajores' or 'baklava'" && exit 1
    ;;
esac

# USAGE: op-deployer bootstrap validator [command options]
# OPTIONS:
#    --l1-rpc-url value         RPC URL for the L1 chain. Must be set for live chains. Can be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --private-key value        Private key of the deployer account. [$DEPLOYER_PRIVATE_KEY]
#    --outfile value            Output file. Use - for stdout. (default: "-") [$DEPLOYER_OUTFILE]
#    --artifacts-locator value  Locator for artifacts. [$DEPLOYER_ARTIFACTS_LOCATOR]
#    --config value             Path to a JSON file [$DEPLOYER_CONFIG]
#    --use-interop              If true, deploy Interop implementations. (default: false) [$DEPLOYER_USE_INTEROP]
echo "Boostrapping validator for $NETWORK!"
$OP_DEPLOYER_CMD bootstrap validator \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --artifacts-locator="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --config="./scripts/foundry/upgrade/config-validator-$NETWORK-$TAG.json" \
  --private-key=$DEPLOYER_PK
