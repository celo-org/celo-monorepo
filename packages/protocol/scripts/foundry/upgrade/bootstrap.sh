#!/usr/bin/env bash
set -euo pipefail

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "$OP_ROOT" ] && echo "Need to set the OP_ROOT via env" && exit 1;
[ -z "$MULTISIG_ADDRESS" ] && echo "Need to set the MULTISIG_ADDRESS via env" && exit 1;
[ -z "$DEPLOYER_PK" ] && echo "Need to set the DEPLOYER_PK via env" && exit 1;

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
if [ "${NETWORK}" == "alfajores" ]; then
echo "Boostrapping implementations for Alfajores!"
op-deployer bootstrap implementations \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --l1-contracts-release="op-contracts/v2.0.0" \
  --artifacts-locator="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --superchain-config-proxy="0xdf4Fb5371B706936527B877F616eAC0e47c9b785" \
  --protocol-versions-proxy="0x5E5FEA4D2A8f632Af05D1E725D7ca865327A080b" \
  --upgrade-controller=$MULTISIG_ADDRESS \
  --private-key=$DEPLOYER_PK
elif [ "${NETWORK}" == "baklava" ]; then
echo "Boostrapping implementations for Baklava!"
op-deployer bootstrap implementations \
  --l1-rpc-url="http://127.0.0.1:8545" \
  --l1-contracts-release="op-contracts/v2.0.0" \
  --artifacts-locator="file://$OP_ROOT/packages/contracts-bedrock/forge-artifacts" \
  --superchain-config-proxy="0xf07502A4a950d870c43b12660fB1Dd18c170D344" \
  --protocol-versions-proxy="0x3d438C63e0431DA844d3F60E6c712d10FC75c529" \
  --upgrade-controller=$MULTISIG_ADDRESS \
  --private-key=$DEPLOYER_PK
else
  echo "Unsupported network! Choose from 'alfajores' or 'baklava'"
fi