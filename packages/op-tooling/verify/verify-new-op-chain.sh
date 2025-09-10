#!/usr/bin/env bash

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;

# Config
RELEASE="celo-contracts/v3.0.0"
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
# DWI="0xe8249b2cffc3f71e433918c5267c71bf1e1fdc1e" # impl for DelayedWETH
# OPI="0x229ac4d29814249ba4830eb0e5b133df664ce4d7" # impl for OptimismPortal
# SCI="0x1edd39f1662fa3f3c4003b013e899c2cff976377" # impl for SystemConfig
# LCDM="0x70b0e58e6039831954ede2ea1e9ef8a51680e4fd" # proxy for L1CrossDomainMessenger
# LCDMI="0xC1dd01079a4358aEc262AD5080239542433d077a" # impl for L1CrossDomainMessenger
# LEB="0xb8c8dcbccd0f7c5e7a2184b13b85d461d8711e96" # proxy for L2ERC721Bridge
# LEBI="0xEf32Aa47df0800B8619d0522FA82a68DD4b9A8D7" # impl for L1ERC721Bridge
# LSB="0xec18a3c30131a0db4246e785355fbc16e2eaf408" # proxy for L1StandardBridge
# LSBI="0x4063C3824D993784A169470e05DACC1b8501D972" # impl for L1StandardBridge
# OMEFI="0xd6e36ca5ef4babe6f890534bd8479b9561c22f94" # impl for OptimismMintableERC20Factory
# DGFI="0x0468d6dfbcb060cea717459a4026339d60fb34d9" # impl for DisputeGameFactory
# ASRI="0xe8e958be5a891ff9aac5410c3923dbafd99174bb" # impl for AnchorStateRegistry
# SUI="0x1b8ca63db2e3e37c1def34f24e4c88ed422bd7c1" # impl for SuperchainConfig
# PVI="0x9a7Ca01B64cE656B927248aF08692Ed2714c68e0" # impl for ProtocolVersions
# PA="0xf7d7a3d3bb8abb6829249b3d3ad3d525d052027e" # ProxyAdmin
# AM="0x8f0c6fc85a53551d87899ac2a5af2b48c793eb63" # AddressManager
# PDG=0x5a4feaeb665f8049ac1e0714f82a11532d47ae49 # PermissionedDisputeGame
# CSUI="0x00cdf709c093702c8019889e7df32d1735b80355" # impl for CeloSuperchainConfig
# CT="0x93ec064ad109077d42b1581c8fa4e8eba34b2d13" # impl for CeloToken

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

verify_proxy() {
    IMPL_SLOT="0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" # keccak256("eip1967.proxy.implementation")
    IMPL_ADDRESS_B32=$(cast storage $1 $IMPL_SLOT -r $RPC_URL)
    IMPL_ADDRESS=$(cast parse-bytes32-address $IMPL_ADDRESS_B32)
    echo "Proxy: $1 ImplB32: $IMPL_ADDRESS_B32 Impl: $IMPL_ADDRESS"
    verify $IMPL_ADDRESS ${@:2}
}

if [ network = "l1" ]; then
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
    verify $OPCM_CONTAINER OPContractsManagerContractsContainer "constructor((address,address,address,address,address,address,address,address,address),(address,address,address,address,address,address,address,address,address,address,address,address))" "$BLUEPRINTS" "$IMPLS"
    verify $OPCM_GTA OPContractsManagerGameTypeAdder "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM_DEPLOYER OPContractsManagerDeployer "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM_UPGRADER OPContractsManagerUpgrader "constructor(address)" $OPCM_CONTAINER # TODO: unverified
    verify $OPCM OPContractsManager "constructor(address,address,address,address,address,address,string,address)" $OPCM_GTA $OPCM_DEPLOYER $OPCM_UPGRADER $CSUI $PVI $PA $RELEASE $DEPLOYER # TODO: unverified
    DELAY_WETH=$(cast call $DWI "delay()(uint256)" -r $RPC_URL)
    echo "Delayed WETH delay: $DELAY_WETH"
    verify $DWI DelayedWETH "constructor(uint256)" $DELAY_WETH
    PROOF_MATURITY=$(cast call $OPI "proofMaturityDelaySeconds()(uint256)" -r $RPC_URL)
    echo "Optimism Portal proof maturity: $PROOF_MATURITY"
    GAME_FINALITY=$(cast call $OPI "disputeGameFinalityDelaySeconds()(uint256)" -r $RPC_URL)
    echo "Optimism Portal game finality: $GAME_FINALITY"
    verify $OPI OptimismPortal2 "constructor(uint256,uint256)" $PROOF_MATURITY $GAME_FINALITY
    verify $SCI SystemConfig
    verify $LCDMI L1CrossDomainMessenger
    verify $LEBI L1ERC721Bridge
    verify $LSBI L1StandardBridge
    verify $OMEFI OptimismMintableERC20Factory
    verify $DGFI DisputeGameFactory
    verify $ASRI AnchorStateRegistry
    verify $SUI SuperchainConfig
    verify $PVI ProtocolVersions
    verify $PA ProxyAdmin
    verify $AM AddressManager
    verify $PDG PermissionedDisputeGame
    verify $CSUI CeloSuperchainConfig # TODO: unverified
    verify $CT CeloTokenL1
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
