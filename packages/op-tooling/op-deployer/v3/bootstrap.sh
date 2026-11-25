#!/usr/bin/env bash
set -euo pipefail

# Require env vars
[ -z "${VERSION:-}" ] && echo "Need to set the VERSION via env" && exit 1;
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${OP_ROOT:-}" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "${MULTISIG_ADDRESS:-}" ] && echo "Need to set the MULTISIG_ADDRESS via env" && exit 1;
[ -z "${DEPLOYER_PK:-}" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

# Check version
case $VERSION in
  "v2.0.0")
    echo "Detected supported version: $VERSION"
    PRESTATE_HASH=0x03b357b30095022ecbb44ef00d1de19df39cf69ee92a60683a6be2c6f8fe6a3e
    ;;
  "v3.0.0")
    echo "Detected supported version: $VERSION"
    PRESTATE_HASH=0x034b32d11f017711ce7122ac71d87b1c6cc73e10a0dbd957d8b27f6360acaf8f
    ;;
  *)
    echo "Invalid version: $VERSION" && exit 1
    ;;
esac

# Set addresses based on network
if [ "${NETWORK}" == "sepolia" ]; then
  SUPERCHAIN_CONFIG_PROXY="0x31bEef32135c90AE8E56Fb071B3587de289Aaf77"
  PROTOCOL_VERSIONS_PROXY="0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd"
  SYSTEM_CONFIG_PROXY="0x760a5f022c9940f4a074e0030be682f560d29818"
  PROXY_ADMIN_OWNER="0x5e60d897Cd62588291656b54655e98ee73f0aabF"
  PROXY_ADMIN="0xf7d7a3d3bb8abb6829249b3d3ad3d525d052027e"
  CHALLENGER="0xC813b28614BD4CFA3d5Fdf153df41B273AB9D497"
  UPGRADE_SUPERCHAIN_CONFIG=true
elif [ "${NETWORK}" == "mainnet" ]; then
  SUPERCHAIN_CONFIG_PROXY="0x95703e0982140D16f8ebA6d158FccEde42f04a4C"
  PROTOCOL_VERSIONS_PROXY="0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663"
  SYSTEM_CONFIG_PROXY="0x89E31965D844a309231B1f17759Ccaf1b7c09861"
  PROXY_ADMIN_OWNER="0x4092A77bAF58fef0309452cEaCb09221e556E112"
  PROXY_ADMIN="0x783A434532Ee94667979213af1711505E8bFE374"
  CHALLENGER="0x6b145ebf66602ec524b196426b46631259689583"
  UPGRADE_SUPERCHAIN_CONFIG=false
else
  echo "Unsupported network! Choose from 'sepolia' or 'mainnet'"
  exit 1
fi

# Set vars
CONFIG_LOC="./"
OP_DEPLOYER_CMD="$OP_ROOT/op-deployer/bin/op-deployer"
L1_CONTRACTS_RELEASE=celo-contracts/$VERSION
ARTIFACTS_LOCATOR="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts"
WITHDRAWAL_DELAY_SECONDS=604800
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

# USAGE: op-deployer bootstrap implementations [command options]
# OPTIONS:
#    --l1-rpc-url value                           RPC URL for the L1 chain. Must be set for live chains. Can be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --private-key value                          Private key of the deployer account. [$DEPLOYER_PRIVATE_KEY]
#    --outfile value                              Output file. Use - for stdout. (default: "-") [$DEPLOYER_OUTFILE]
#    --artifacts-locator value                    Locator for artifacts. [$DEPLOYER_ARTIFACTS_LOCATOR]
#    --l1-contracts-release op-contracts/vX.Y.Z   Release version to set OPCM implementations for, of the format op-contracts/vX.Y.Z. [$DEPLOYER_L1_CONTRACTS_RELEASE]
#    --mips-version value                         MIPS version. (default: 1) [$DEPLOYER_MIPS_VERSION]
#    --withdrawal-delay-seconds value             Withdrawal delay in seconds. (default: 302400) [$DEPLOYER_WITHDRAWAL_DELAY_SECONDS]
#    --min-proposal-size-bytes value              PreimageOracle minimum proposal size in bytes. (default: 126000) [$DEPLOYER_MIN_PROPOSAL_SIZE_BYTES]
#    --challenge-period-seconds value             PreimageOracle challenge period in seconds. (default: 86400) [$DEPLOYER_CHALLENGE_PERIOD_SECONDS]
#    --proof-maturity-delay-seconds value         Proof maturity delay in seconds. (default: 604800) [$DEPLOYER_PROOF_MATURITY_DELAY_SECONDS]
#    --dispute-game-finality-delay-seconds value  Dispute game finality delay in seconds. (default: 302400) [$DEPLOYER_DISPUTE_GAME_FINALITY_DELAY_SECONDS]
#    --superchain-config-proxy value              Superchain config proxy. [$DEPLOYER_SUPERCHAIN_CONFIG_PROXY]
#    --protocol-versions-proxy value              Protocol versions proxy. [$DEPLOYER_PROTOCOL_VERSIONS_PROXY]
#    --upgrade-controller value                   Upgrade controller. [$DEPLOYER_UPGRADE_CONTROLLER]
#    --use-interop                                If true, deploy Interop implementations. (default: false) [$DEPLOYER_USE_INTEROP]

echo "Performing bootstrap implementations to $VERSION for $NETWORK!"
BOOTSTRAP_OUTPUT=`mktemp`
$OP_DEPLOYER_CMD bootstrap implementations \
  --l1-rpc-url="$L1_RPC_URL" \
  --l1-contracts-release="$L1_CONTRACTS_RELEASE" \
  --artifacts-locator="$ARTIFACTS_LOCATOR" \
  --withdrawal-delay-seconds="$WITHDRAWAL_DELAY_SECONDS" \
  --superchain-config-proxy="$SUPERCHAIN_CONFIG_PROXY" \
  --protocol-versions-proxy="$PROTOCOL_VERSIONS_PROXY" \
  --upgrade-controller=$MULTISIG_ADDRESS \
  --private-key=$DEPLOYER_PK | tee $BOOTSTRAP_OUTPUT

# Set OPCM address from bootstrap output
BOOTSTRAP_JSON=`mktemp`
awk '/{/ { json_start=1 }; json_start==1 { print }; /}/ { json_start=0 }' $BOOTSTRAP_OUTPUT > $BOOTSTRAP_JSON
OPCM=`jq --raw-output '.Opcm' $BOOTSTRAP_JSON`

# Load addresses from bootstrap
ANCHOR_STATE_REGISTRY_IMPL=`jq --raw-output '.AnchorStateRegistryImpl' $BOOTSTRAP_JSON`
DELAYED_WETH_IMPL=`jq --raw-output '.DelayedWETHImpl' $BOOTSTRAP_JSON`
DISPUTE_GAME_FACTORY_IMPL=`jq --raw-output '.DisputeGameFactoryImpl' $BOOTSTRAP_JSON`
L1_CROSS_DOMAIN_MESSENGER_IMPL=`jq --raw-output '.L1CrossDomainMessengerImpl' $BOOTSTRAP_JSON`
L1_ERC721_BRIDGE_IMPL=`jq --raw-output '.L1ERC721BridgeImpl' $BOOTSTRAP_JSON`
L1_STANDARD_BRIDGE_IMPL=`jq --raw-output '.L1StandardBridgeImpl' $BOOTSTRAP_JSON`
MIPS_SINGLETON=`jq --raw-output '.MipsSingleton' $BOOTSTRAP_JSON`
OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL=`jq --raw-output '.OptimismMintableERC20FactoryImpl' $BOOTSTRAP_JSON`
OPTIMISM_PORTAL_IMPL=`jq --raw-output '.OptimismPortalImpl' $BOOTSTRAP_JSON`
PROTOCOL_VERSIONS_IMPL=`jq --raw-output '.ProtocolVersionsImpl' $BOOTSTRAP_JSON`
SUPERCHAIN_CONFIG_IMPL=`jq --raw-output '.SuperchainConfigImpl' $BOOTSTRAP_JSON`
SYSTEM_CONFIG_IMPL=`jq --raw-output '.SystemConfigImpl' $BOOTSTRAP_JSON`

# Workaround until we fix deterministic addresses
if [ "${VERSION}" = "v3.0.0" ] && [ -f "$CONFIG_LOC/config-validator.json" ]; then
  echo "Using workaround for v3 config validator!"
  DELAYED_WETH_IMPL=`cat $CONFIG_LOC/config-validator.json | jq .delayedWETHImpl`
  DELAYED_WETH_IMPL="${DELAYED_WETH_IMPL#\"}" # Remove leading "
  DELAYED_WETH_IMPL="${DELAYED_WETH_IMPL%\"}" # Remove trailing "
  OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL=`cat $CONFIG_LOC/config-validator.json | jq .optimismMintableERC20FactoryImpl`
  OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL="${OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL#\"}" # Remove leading "
  OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL="${OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL%\"}" # Remove trailing "
fi

# Create validator config
cat > $CONFIG_LOC/config-validator.json << END
{
  "release": "$VERSION",
  "anchorStateRegistryImpl": "$ANCHOR_STATE_REGISTRY_IMPL",
  "challenger": "$CHALLENGER",
  "delayedWETHImpl": "$DELAYED_WETH_IMPL",
  "disputeGameFactoryImpl": "$DISPUTE_GAME_FACTORY_IMPL",
  "l1CrossDomainMessengerImpl": "$L1_CROSS_DOMAIN_MESSENGER_IMPL",
  "l1ERC721BridgeImpl": "$L1_ERC721_BRIDGE_IMPL",
  "l1PAOMultisig": "$PROXY_ADMIN_OWNER",
  "l1StandardBridgeImpl": "$L1_STANDARD_BRIDGE_IMPL",
  "mips": "$MIPS_SINGLETON",
  "mipsImpl": "$MIPS_SINGLETON",
  "optimismMintableERC20FactoryImpl": "$OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL",
  "optimismPortalImpl": "$OPTIMISM_PORTAL_IMPL",
  "protocolVersionsImpl": "$PROTOCOL_VERSIONS_IMPL",
  "superchainConfig": "$SUPERCHAIN_CONFIG_PROXY",
  "superchainConfigImpl": "$SUPERCHAIN_CONFIG_IMPL",
  "systemConfigImpl": "$SYSTEM_CONFIG_IMPL"
}
END

# Create upgrade config
cat > $CONFIG_LOC/config-upgrade.json <<END
{
  "prank": "$PROXY_ADMIN_OWNER",
  "opcm": "$OPCM",
  "chainConfigs": [
    {
      "systemConfigProxy": "$SYSTEM_CONFIG_PROXY",
      "proxyAdmin": "$PROXY_ADMIN",
      "absolutePrestate": "$PRESTATE_HASH"
    }
  ],
  "upgradeSuperchainConfig": $UPGRADE_SUPERCHAIN_CONFIG
}
END
