#!/bin/bash


# Create L2 WETH token if necessary:
# cast send 0x4200000000000000000000000000000000000012 "createOptimismMintableERC20(address,string,string)" $WETH_L1_ADDR "Wrapped ETH (Celo native bridge)" "WETH" --private-key $PRIVKEY

if ! command -v forge &> /dev/null
then
    echo "forge could not be found, please install forge."
    exit 1
fi

NETWORK=${1:-alfajores}

if [ -f ".env.$NETWORK" ]; then
    export $(grep -v '^#' ".env.$NETWORK" | xargs)
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable is not set."
    echo "Please set it in your environment or in the .env.$NETWORK file."
    exit 1
fi

deploy_alfajores() {
    echo "Deploying to Alfajores..."
    export WETH_ADDRESS_LOCAL="0x94373a4919B3240D86eA41593D5eBa789FEF3848"
    export WETH_ADDRESS_REMOTE="0x4EE7Ea447197c6b7BE0ab1A068F55c74a3390F33"
    # L1StandardBridgeProxy
    export STANDARD_BRIDGE_ADDRESS="0xD1B0E0581973c9eB7f886967A606b9441A897037"
    export RPC_URL="https://ethereum-holesky-rpc.publicnode.com"
    
    FORGE_ARGS="--rpc-url $RPC_URL --broadcast"
    if [ -n "$ETHERSCAN_API_KEY" ]; then
        FORGE_ARGS="$FORGE_ARGS --verify --etherscan-api-key $ETHERSCAN_API_KEY"
        echo "Verification enabled."
    else
        echo "ETHERSCAN_API_KEY not set. Skipping verification."
    fi

    echo "Using WETH_ADDRESS_LOCAL: $WETH_ADDRESS_LOCAL"
    echo "Using WETH_ADDRESS_REMOTE: $WETH_ADDRESS_REMOTE"
    echo "Using STANDARD_BRIDGE_ADDRESS: $STANDARD_BRIDGE_ADDRESS"

    forge script scripts/DeploySuperbridgeWETH.s.sol:DeploySuperBridgeWETH $FORGE_ARGS

    # SuperBridgeETHWrapper deployed to holesky at: 0x78fb67119c4a055d6eb497b1aa5d09f7124225e5
}

deploy_baklava() {
    echo "Deploying to Baklava..."
    export WETH_ADDRESS_LOCAL="0x94373a4919B3240D86eA41593D5eBa789FEF3848"
    export WETH_ADDRESS_REMOTE="0xBEcfCB91527166382187D5EE80ac07433D01549e"
    # L1StandardBridgeProxy
    export STANDARD_BRIDGE_ADDRESS="0x6fd3fF186975aD8B66Ab40b705EC016b36da0486"

    export RPC_URL="https://ethereum-holesky-rpc.publicnode.com"

    FORGE_ARGS="--rpc-url $RPC_URL --broadcast"
    if [ -n "$ETHERSCAN_API_KEY" ]; then
        FORGE_ARGS="$FORGE_ARGS --verify --etherscan-api-key $ETHERSCAN_API_KEY"
        echo "Verification enabled."
    else
        echo "ETHERSCAN_API_KEY not set. Skipping verification."
    fi

    echo "Using WETH_ADDRESS_LOCAL: $WETH_ADDRESS_LOCAL"
    echo "Using WETH_ADDRESS_REMOTE: $WETH_ADDRESS_REMOTE"
    echo "Using STANDARD_BRIDGE_ADDRESS: $STANDARD_BRIDGE_ADDRESS"

    forge script scripts/DeploySuperbridgeWETH.s.sol:DeploySuperBridgeWETH $FORGE_ARGS
    # SuperBridgeETHWrapper deployed to holesky at: 0x6b7FAa7cC86DCd14e78F6a78F2dCfC76f8042e58
}


deploy_mainnet() {
    echo "Deploying to Mainnet..."
    export WETH_ADDRESS_LOCAL="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    export WETH_ADDRESS_REMOTE="0xD221812de1BD094f35587EE8E174B07B6167D9Af"
    export STANDARD_BRIDGE_ADDRESS="0x9C4955b92F34148dbcfDCD82e9c9eCe5CF2badfe"

    export RPC_URL="https://eth.llamarpc.com"

    FORGE_ARGS="--rpc-url $RPC_URL --broadcast"
    if [ -n "$ETHERSCAN_API_KEY" ]; then
        FORGE_ARGS="$FORGE_ARGS --verify --etherscan-api-key $ETHERSCAN_API_KEY"
        echo "Verification enabled."
    else
        echo "ETHERSCAN_API_KEY not set. Skipping verification."
    fi

    echo "Using WETH_ADDRESS_LOCAL: $WETH_ADDRESS_LOCAL"
    echo "Using WETH_ADDRESS_REMOTE: $WETH_ADDRESS_REMOTE"
    # L1StandardBridgeProxy
    echo "Using STANDARD_BRIDGE_ADDRESS: $STANDARD_BRIDGE_ADDRESS"

    forge script scripts/DeploySuperbridgeWETH.s.sol:DeploySuperBridgeWETH $FORGE_ARGS
    # SuperBridgeETHWrapper deployed to mainnet at: 0x3bC7C4f8Afe7C8d514c9d4a3A42fb8176BE33c1e
}

case $NETWORK in
    alfajores)
        deploy_alfajores
        ;;
    baklava)
        deploy_baklava
        ;;
    mainnet)
        deploy_mainnet
        ;;
    *)
        echo "Usage: $0 [alfajores|baklava|mainnet]"
        exit 1
        ;;
esac

echo "Deployment script finished for $NETWORK."
