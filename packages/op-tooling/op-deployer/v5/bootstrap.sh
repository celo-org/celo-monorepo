#!/usr/bin/env bash
set -euo pipefail

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${OP_ROOT:-}" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "${MULTISIG_ADDRESS:-}" ] && echo "Need to set the MULTISIG_ADDRESS via env" && exit 1;
[ -z "${DEPLOYER_PK:-}" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

# Set addresses based on network
if [ "${NETWORK}" == "chaos" ]; then
  SUPERCHAIN_CONFIG_PROXY="0x852A5763dA3Fdf51a8b816E02b91A054904Bd8B0"
  PROTOCOL_VERSIONS_PROXY="0x433a83893DDA68B941D4aefA908DED9c599522ad"
  SYSTEM_CONFIG_PROXY="0x624ce254d4d0e84e4179897c9e9b97784f37f6fd"
  PROXY_ADMIN_OWNER="0xa3A3a43E2de78070129C697A5CdCa0618B1f574d"
  PROXY_ADMIN="0x6151d1cc7724ee7594f414c152320757c9c5844e"
  CHALLENGER="0x240531edDDE480d09271cc8f8113c60fbCB3785d"
  UPGRADE_SUPERCHAIN_CONFIG=true
  WITHDRAWAL_DELAY_SECONDS=86400
  PROOF_MATURITY_DELAY_SECONDS=86400
  DISPUTE_GAME_FINALITY_DELAY_SECONDS=43200
  CHALLENGE_PERIOD_SECONDS=21600
elif [ "${NETWORK}" == "sepolia" ]; then
  SUPERCHAIN_CONFIG_PROXY="0x31bEef32135c90AE8E56Fb071B3587de289Aaf77"
  PROTOCOL_VERSIONS_PROXY="0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd"
  SYSTEM_CONFIG_PROXY="0x760a5f022c9940f4a074e0030be682f560d29818"
  PROXY_ADMIN_OWNER="0x5e60d897Cd62588291656b54655e98ee73f0aabF"
  PROXY_ADMIN="0xf7d7a3d3bb8abb6829249b3d3ad3d525d052027e"
  CHALLENGER="0xC813b28614BD4CFA3d5Fdf153df41B273AB9D497"
  UPGRADE_SUPERCHAIN_CONFIG=true
  WITHDRAWAL_DELAY_SECONDS=604800
  PROOF_MATURITY_DELAY_SECONDS=604800
  DISPUTE_GAME_FINALITY_DELAY_SECONDS=302400
  CHALLENGE_PERIOD_SECONDS=86400
elif [ "${NETWORK}" == "mainnet" ]; then
  SUPERCHAIN_CONFIG_PROXY="0x95703e0982140D16f8ebA6d158FccEde42f04a4C"
  PROTOCOL_VERSIONS_PROXY="0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663"
  SYSTEM_CONFIG_PROXY="0x89E31965D844a309231B1f17759Ccaf1b7c09861"
  PROXY_ADMIN_OWNER="0x4092A77bAF58fef0309452cEaCb09221e556E112"
  PROXY_ADMIN="0x783A434532Ee94667979213af1711505E8bFE374"
  CHALLENGER="0x6b145ebf66602ec524b196426b46631259689583"
  UPGRADE_SUPERCHAIN_CONFIG=false
  WITHDRAWAL_DELAY_SECONDS=604800
  PROOF_MATURITY_DELAY_SECONDS=604800
  DISPUTE_GAME_FINALITY_DELAY_SECONDS=302400
  CHALLENGE_PERIOD_SECONDS=86400
else
  echo "Unsupported network! Choose from 'chaos', 'sepolia' or 'mainnet'"
  exit 1
fi

# Set vars
CONFIG_LOC="./"
OP_DEPLOYER_CMD="$OP_ROOT/op-deployer/bin/op-deployer"
ARTIFACTS_LOCATOR="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts"
PRESTATE_HASH=0x03caa1871bb9fe7f9b11217c245c16e4ded33367df5b3ccb2c6d0a847a217d1b
if [[ -z "${RPC_URL:-}" ]]; then
  L1_RPC_URL=http://localhost:8545
  echo "Using localhost"
else
  L1_RPC_URL=$RPC_URL
  echo "Using rpc: $L1_RPC_URL"
fi
VERIFIER_API_KEY="${VERIFIER_API_KEY:-}"

###################
# OP-DEPLOYER CMD #
###################

# USAGE: op-deployer bootstrap implementations [command options]
# OPTIONS:
#    --l1-rpc-url value                                        RPC URL for the L1 chain. Must be set for live chains. Must be blank for chains deploying to local allocs files. [$L1_RPC_URL]
#    --private-key value                                       Private key of the deployer account. [$DEPLOYER_PRIVATE_KEY]
#    --outfile value                                           Output file. Use - for stdout. (default: "-") [$DEPLOYER_OUTFILE]
#    --artifacts-locator value                                 Locator for artifacts. (default: "embedded") [$DEPLOYER_ARTIFACTS_LOCATOR]
#    --mips-version value                                      MIPS version. (default: 8) [$DEPLOYER_MIPS_VERSION]
#    --dev-feature-bitmap value                                Development feature bitmap. (default: "0x0000000000000000000000000000000000000000000000000000000000000000") [$DEPLOYER_DEV_FEATURE_BITMAP]
#    --withdrawal-delay-seconds value                          Withdrawal delay in seconds. (default: 302400) [$DEPLOYER_WITHDRAWAL_DELAY_SECONDS]
#    --min-proposal-size-bytes value                           PreimageOracle minimum proposal size in bytes. (default: 126000) [$DEPLOYER_MIN_PROPOSAL_SIZE_BYTES]
#    --challenge-period-seconds value                          PreimageOracle challenge period in seconds. (default: 86400) [$DEPLOYER_CHALLENGE_PERIOD_SECONDS]
#    --proof-maturity-delay-seconds value                      Proof maturity delay in seconds. (default: 604800) [$DEPLOYER_PROOF_MATURITY_DELAY_SECONDS]
#    --dispute-game-finality-delay-seconds value               Dispute game finality delay in seconds. (default: 302400) [$DEPLOYER_DISPUTE_GAME_FINALITY_DELAY_SECONDS]
#    --superchain-config-proxy value                           Superchain config proxy. [$DEPLOYER_SUPERCHAIN_CONFIG_PROXY]
#    --protocol-versions-proxy value                           Protocol versions proxy. [$DEPLOYER_PROTOCOL_VERSIONS_PROXY]
#    --l1-proxy-admin-owner value, --upgrade-controller value  L1 ProxyAdmin Owner. [$DEPLOYER_L1_PROXY_ADMIN_OWNER, $DEPLOYER_UPGRADE_CONTROLLER]
#    --superchain-proxy-admin value                            Superchain proxy admin. [$DEPLOYER_SUPERCHAIN_PROXY_ADMIN]
#    --challenger value                                        Challenger. [$DEPLOYER_CHALLENGER]
#    --verify                                                  automatically verify contracts after deployment (default: false) [$DEPLOYER_VERIFY]
#    --verifier value                                          contract verifier type(s) to use. (default: "etherscan") [$DEPLOYER_VERIFIER_TYPE]
#    --verifier-url value                                      verifier URL [$DEPLOYER_VERIFIER_URL]
#    --verifier-api-key value, --etherscan-api-key value       API key for contract verifier [$DEPLOYER_VERIFIER_API_KEY, $DEPLOYER_ETHERSCAN_API_KEY]

echo "Performing bootstrap implementations for $NETWORK!"
BOOTSTRAP_OUTPUT=`mktemp`
if [ -z $VERIFIER_API_KEY ]; then
  $OP_DEPLOYER_CMD bootstrap implementations \
    --l1-rpc-url="$L1_RPC_URL" \
    --artifacts-locator="$ARTIFACTS_LOCATOR" \
    --withdrawal-delay-seconds="$WITHDRAWAL_DELAY_SECONDS" \
    --challenge-period-seconds="$CHALLENGE_PERIOD_SECONDS" \
    --proof-maturity-delay-seconds="$PROOF_MATURITY_DELAY_SECONDS" \
    --dispute-game-finality-delay-seconds="$DISPUTE_GAME_FINALITY_DELAY_SECONDS" \
    --superchain-config-proxy="$SUPERCHAIN_CONFIG_PROXY" \
    --protocol-versions-proxy="$PROTOCOL_VERSIONS_PROXY" \
    --l1-proxy-admin-owner=$MULTISIG_ADDRESS \
    --superchain-proxy-admin=$PROXY_ADMIN \
    --challenger=$CHALLENGER \
    --private-key=$DEPLOYER_PK | tee $BOOTSTRAP_OUTPUT
else
  $OP_DEPLOYER_CMD bootstrap implementations \
    --l1-rpc-url="$L1_RPC_URL" \
    --artifacts-locator="$ARTIFACTS_LOCATOR" \
    --withdrawal-delay-seconds="$WITHDRAWAL_DELAY_SECONDS" \
    --challenge-period-seconds="$CHALLENGE_PERIOD_SECONDS" \
    --proof-maturity-delay-seconds="$PROOF_MATURITY_DELAY_SECONDS" \
    --dispute-game-finality-delay-seconds="$DISPUTE_GAME_FINALITY_DELAY_SECONDS" \
    --superchain-config-proxy="$SUPERCHAIN_CONFIG_PROXY" \
    --protocol-versions-proxy="$PROTOCOL_VERSIONS_PROXY" \
    --l1-proxy-admin-owner=$MULTISIG_ADDRESS \
    --superchain-proxy-admin=$PROXY_ADMIN \
    --challenger=$CHALLENGER \
    --private-key=$DEPLOYER_PK \
    --verify \
    --verifier-api-key $VERIFIER_API_KEY | tee $BOOTSTRAP_OUTPUT
fi

# Set OPCM address from bootstrap output
BOOTSTRAP_JSON=`mktemp`
awk '/{/ { json_start=1 }; json_start==1 { print }; /}/ { json_start=0 }' $BOOTSTRAP_OUTPUT > $BOOTSTRAP_JSON
OPCM=`jq --raw-output '.opcmAddress' $BOOTSTRAP_JSON`

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
