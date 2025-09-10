#!/usr/bin/env bash
set -euo pipefail

# Baklava: V3
# VALIDATOR=0x9df52e41189e89485bb7aee1e5cc93874dd89712

# Alfajores: V3
# VALIDATOR=0xc6bacfa8421117677e03c3eb81d44b37a9ceef31

# Require env vars
[ -z "${VERSION:-}" ] && echo "Need to set the VERSION via env" && exit 1;
[ -z "${VALIDATOR:-}" ] && echo "Need to set the VERSION via env" && exit 1;

# Optional env vars
if [ -z "${CHAIN_ID:-}" ]; then
    # Fallback to Holesky
    CHAIN_ID=17000
fi

if [ "$CHAIN_ID:-" = "17000"]; then
    BLOCKSCOUT_URL=https://eth-holesky.blockscout.com/api/
else
    BLOCKSCOUT_URL=https://eth.blockscout.com/api/
fi

# Check version
case $VERSION in
    "v2")
        echo "Detected supported version: $VERSION"
        CONTRACT="StandardValidatorV200"
    ;;
    "v3")
        echo "Detected supported version: $VERSION"
        CONTRACT="StandardValidatorV300"
    ;;
    *)
    echo "Invalid version: $VERSION" && exit 1
    ;;
esac

verify() {
    CONSTRUCTOR_SIG=${3:-}
    if [ "${BLOCKSCOUT_API_KEY:-}" ]; then
        echo ">>> [Blockscout] $2"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    if [ "${ETHERSCAN_API_KEY:-}" ]; then
        echo ">>> [Etherscan] $2"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    if [ "${TENDERLY_URL:-}" ] && [ "${TENDERLY_API_KEY:-}" ]; then
        echo ">>> [Tenderly] $2"
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
}

verify $VALIDATOR $CONTRACT \
    "constructor((address,address,address,address,address,address,address,address,address,address),address,address,address,address)" \
    "($LEBI,$OPI,$SCI,$OMEFI,$LCMDI,$LSBI,$DGFI,$ASRI,$DWI,$MIPSI)" $SUI $LPM $MIPS $CHALLENGER
