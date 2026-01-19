#!/usr/bin/env bash

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${RELEASE:-}" ] && echo "Need to set the RELEASE via env (example value: celo-contracts/v3.0.0)" && exit 1;

# Config
DEPLOYER="0x95a40aA01d2d72b4122C19c86160710D01224ada"
USE_INTEROP="false" # Set to true if you interop is enabled and contracts are deployed on L2

# Check network
case $NETWORK in
  "l1")
    echo "Detected network: $NETWORK (sepolia)"
    [ -z "${ALCHEMY_KEY:-}" ] && echo "Need to set the ALCHEMY_KEY via env" && exit 1;
    BLOCKSCOUT_URL=https://eth-sepolia.blockscout.com/api/
    CHAIN_ID=11155111
    RPC_URL=https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY
    ;;
  "l2")
    echo "Detected network: $NETWORK (celo-sepolia)"
    BLOCKSCOUT_URL=https://celo-sepolia.blockscout.com/api/
    CHAIN_ID=11142220
    RPC_URL=https://forno.celo-sepolia.celo-testnet.org
    ;;
  *)
    echo "Unsupported network: $NETWORK" && exit 1
    ;;
esac

# L1 contracts
# OPCM="0xf25a271ba3c290c9fc094c600179c4709f23e0dd"
# OPCM_GTA="0x6d5f8c3a8a84cc32e70097aaf2f2aa5ba6955857"
# OPCM_DEPLOYER="0xc7d9db993b9b61410299073fe748f5217bb8904a"
# OPCM_UPGRADER="0x6c8fc16bf0b1665cdb9fed485250088b67f873c1"
# DW="0x082f5f58b664cd1d51f9845fee322aba2ced9cba" # proxy for DelayedWETH
# OP="0x44ae3d41a335a7d05eb533029917aad35662dcc2" # proxy for OptimismPortal
# SC="0x760a5f022c9940f4a074e0030be682f560d29818" # proxy for SystemConfig
# LCDM="0x70b0e58e6039831954ede2ea1e9ef8a51680e4fd" # proxy for L1CrossDomainMessenger
# LEB="0xb8c8dcbccd0f7c5e7a2184b13b85d461d8711e96" # proxy for L2ERC721Bridge
# LSB="0xec18a3c30131a0db4246e785355fbc16e2eaf408" # proxy for L1StandardBridge
# OMEF="0x261be2ed7241fed9c746e0b5dff3a4a335991377" # proxy for OptimismMintableERC20Factory
# DGF="0x57c45d82d1a995f1e135b8d7edc0a6bb5211cfaa" # proxy for DisputeGameFactory
# ASR="0xd73ba8168a61f3e917f0930d5c0401aa47e269d6" # proxy for AnchorStateRegistry
# SU="0x31bEef32135c90AE8E56Fb071B3587de289Aaf77" # proxy for SuperchainConfig
# PV="0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd" # proxy for ProtocolVersions
# PA="0xf7d7a3d3bb8abb6829249b3d3ad3d525d052027e" # ProxyAdmin
# AM="0x8f0c6fc85a53551d87899ac2a5af2b48c793eb63" # AddressManager
# PDG="0x5a4feaeb665f8049ac1e0714f82a11532d47ae49" # PermissionedDisputeGame
# CSU="0x5c34140a1273372211bd75184ccc9e434b38d86b" # proxy for CeloSuperchainConfig
# CT="0x3c7011fd5e6aed460caa4985cf8d8caba435b092" # proxy for CeloToken

# L2 contracts
# L2_LMP="0x4200000000000000000000000000000000000000" # proxy for LegacyMessagePasser
# L2_DWL="0x4200000000000000000000000000000000000002" # proxy for DeployerWhitelist
# L2_WE="0x4200000000000000000000000000000000000006" # WETH (no proxy)
# L2_LCDM="0x4200000000000000000000000000000000000007" # proxy for L2CrossDomainMessenger (L1CrossDomainMessengerProxy)
# L2_GPO="0x420000000000000000000000000000000000000f" # proxy for GasPriceOracle
# L2_LSB="0x4200000000000000000000000000000000000010" # proxy for L2StandardBridge (L1StandardBridgeProxy)
# L2_SFV="0x4200000000000000000000000000000000000011" # proxy for SequencerFeeVault
# L2_OMEF="0x4200000000000000000000000000000000000012" # proxy for OptimismMintableERC20Factory
# L2_LBN="0x4200000000000000000000000000000000000013" # proxy for L1BlockNumber
# L2_LEB="0x4200000000000000000000000000000000000014" # proxy for L2ERC721Bridge (L1ERC721Bridge)
# L2_LB="0x4200000000000000000000000000000000000015" # proxy for L1Block
# L2_LTLMP="0x4200000000000000000000000000000000000016" # proxy for L2ToL1MessagePasser
# L2_OMEF="0x4200000000000000000000000000000000000017" # proxy for OptimismMintableERC721Factory
# L2_PA="0x4200000000000000000000000000000000000018" # proxy for ProxyAdmin
# L2_BFV="0x4200000000000000000000000000000000000019" # proxy for BaseFeeVault
# L2_LFV="0x420000000000000000000000000000000000001A" # proxy for L1FeeVault
# L2_OFV="0x420000000000000000000000000000000000001B" # proxy for OperatorFeeVault
# L2_SR="0x4200000000000000000000000000000000000020" # proxy for SchemaRegistry
# L2_EAS="0x4200000000000000000000000000000000000021" # proxy for EAS
# L2_GT="0x4200000000000000000000000000000000000042" # GovernanceToken (no proxy)
# if [ $USE_INTEROP = "true" ]; then
#     L2_CLI="0x4200000000000000000000000000000000000022" # proxy for CeloL2Interop
#     L2_LLCDM="0x4200000000000000000000000000000000000023" # proxy for L2ToL2CrossDomainMessenger
#     L2_SWE="0x4200000000000000000000000000000000000024" # proxy for SuperchainWETH
#     L2_EL="0x4200000000000000000000000000000000000025" # proxy for ETHLiquidity
#     L2_STB="0x4200000000000000000000000000000000000026" # proxy for SuperchainTokenBridge
# fi

verify() {
    CONSTRUCTOR_SIG=${3:-}
    if [ "${BLOCKSCOUT_API_KEY:-}" ]; then
        echo ">>> [Blockscout] $2 ($1)"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --verifier=blockscout \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --verifier=blockscout \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    if [ "${ETHERSCAN_API_KEY:-}" ]; then
        echo ">>> [Etherscan] $2 ($1)"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --verifier=etherscan \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --verifier=etherscan \
                --watch
        fi
    fi
    if [ "${TENDERLY_URL:-}" ] && [ "${TENDERLY_API_KEY:-}" ]; then
        echo ">>> [Tenderly] $2 ($1)"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --verifier-url=$TENDERLY_URL \
                --etherscan-api-key=$TENDERLY_API_KEY \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --verifier-url=$TENDERLY_URL \
                --etherscan-api-key=$TENDERLY_API_KEY \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    echo "----------------------------------------"
}

get_impl() {
  IMPL_SLOT="0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" # keccak256("eip1967.proxy.implementation")
  export IMPL_ADDRESS_B32=$(cast storage $1 $IMPL_SLOT -r $RPC_URL)
  export IMPL_ADDRESS=$(cast parse-bytes32-address $IMPL_ADDRESS_B32)
}

verify_proxy() {
  get_impl $1
  echo "Proxy: $1 ImplB32: $IMPL_ADDRESS_B32 Impl: $IMPL_ADDRESS"
  verify $IMPL_ADDRESS ${@:2}
}

if [ "$NETWORK" = "l1" ]; then
    echo ">>> [L1] Verifying contracts on $NETWORK"
    # start verifying contracts
    OPCM_CONTAINER=$(cast call $OPCM_GTA "contractsContainer()(address)" -r $RPC_URL)
    echo "OPCM Container: $OPCM_CONTAINER"
    BLUEPRINTS=$(cast call $OPCM_CONTAINER "blueprints()((address,address,address,address,address,address,address,address,address))" -r $RPC_URL)
    BLUEPRINTS="${BLUEPRINTS// /}" # Remove spaces
    echo "OPCM Blueprints: $BLUEPRINTS"
    IMPLS=$(cast call $OPCM_CONTAINER "implementations()((address,address,address,address,address,address,address,address,address,address,address,address))" -r $RPC_URL)
    IMPLS="${IMPLS// /}" # Remove spaces
    echo "OPCM Implementations: $IMPLS"
    get_impl $CSU
    CSUI=$IMPL_ADDRESS
    echo "CeloSuperchainConfig Impl: $CSUI"
    get_impl $PV
    PVI=$IMPL_ADDRESS
    echo "ProtocolVersions Impl: $PVI"
    verify $OPCM_CONTAINER OPContractsManagerContractsContainer "constructor((address,address,address,address,address,address,address,address,address),(address,address,address,address,address,address,address,address,address,address,address,address))" "$BLUEPRINTS" "$IMPLS"
    verify $OPCM_GTA OPContractsManagerGameTypeAdder "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM_DEPLOYER OPContractsManagerDeployer "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM_UPGRADER OPContractsManagerUpgrader "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM OPContractsManager "constructor(address,address,address,address,address,address,string,address)" $OPCM_GTA $OPCM_DEPLOYER $OPCM_UPGRADER $CSUI $PVI $PA $RELEASE $DEPLOYER # TODO: unverified
    DELAY_WETH=$(cast call $DW "delay()(uint256)" -r $RPC_URL)
    echo "Delayed WETH delay: $DELAY_WETH"
    verify_proxy $DW DelayedWETH "constructor(uint256)" $DELAY_WETH
    PROOF_MATURITY=$(cast call $OP "proofMaturityDelaySeconds()(uint256)" -r $RPC_URL)
    echo "Optimism Portal proof maturity: $PROOF_MATURITY"
    GAME_FINALITY=$(cast call $OP "disputeGameFinalityDelaySeconds()(uint256)" -r $RPC_URL)
    echo "Optimism Portal game finality: $GAME_FINALITY"
    verify_proxy $OP OptimismPortal2 "constructor(uint256,uint256)" $PROOF_MATURITY $GAME_FINALITY
    verify_proxy $LCDM L1CrossDomainMessenger
    verify_proxy $LEB L1ERC721Bridge
    verify_proxy $LSB L1StandardBridge
    verify_proxy $CSU CeloSuperchainConfig
    verify_proxy $PV ProtocolVersions
    verify_proxy $SU SuperchainConfig
    verify_proxy $SC SystemConfig
    verify_proxy $OMEF OptimismMintableERC20Factory
    verify_proxy $ASR AnchorStateRegistry
    verify_proxy $DGF DisputeGameFactory
    verify_proxy $CT CeloTokenL1
    verify $PA ProxyAdmin
    verify $AM AddressManager
    verify $PDG PermissionedDisputeGame
    # end verifying contracts
    echo ">>> [L1] Finished verifying contracts on $NETWORK"
else
    echo ">>> [L2] Verifying contracts on $NETWORK"
    # start verifying contracts
    verify_proxy $L2_LMP LegacyMessagePasser
    verify_proxy $L2_DWL DeployerWhitelist
    verify $L2_WE WETH
    verify_proxy $L2_LCDM L2CrossDomainMessenger "constructor(address)" $LCDM
    verify_proxy $L2_GPO GasPriceOracle
    verify_proxy $L2_LSB L2StandardBridge "constructor(address)" $LSB
    verify_proxy $L2_SFV SequencerFeeVault
    verify_proxy $L2_OMEF OptimismMintableERC20Factory
    verify_proxy $L2_LBN L1BlockNumber
    verify_proxy $L2_LEB L2ERC721Bridge "constructor(address)" $LEB
    verify_proxy $L2_LB L1Block
    verify_proxy $L2_LTLMP L2ToL1MessagePasser
    verify_proxy $L2_OMEF OptimismMintableERC721Factory
    verify_proxy $L2_PA ProxyAdmin
    verify_proxy $L2_BFV BaseFeeVault
    verify_proxy $L2_LFV L1FeeVault
    verify_proxy $L2_OFV OperatorFeeVault
    verify_proxy $L2_SR SchemaRegistry
    verify_proxy $L2_EAS EAS
    verify $L2_GT GovernanceToken # not deployed?
    if [ $USE_INTEROP = "true" ]; then
        verify_proxy $L2_CLI CeloL2Interop
        verify_proxy $L2_LLCDM L2ToL2CrossDomainMessenger
        verify_proxy $L2_SWE SuperchainWETH
        verify_proxy $L2_EL ETHLiquidity
        verify_proxy $L2_STB SuperchainTokenBridge
    fi
    # end verifying contracts
    echo ">>> [L2] Finished verifying contracts on $NETWORK"
fi
