#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

echo "Deploying precompiles:"

# TODO insteadl of deploying one by one
EpochSizeAddress=0x00000000000000000000000000000000000000f8
EpochSizeBytecode=`cat ./out-truffle-compat-0.8/EpochSizePrecompile.sol/EpochSizePrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url $ANVIL_RPC_URL $EpochSizeAddress $EpochSizeBytecode

ProofOfPossesionAddress=0x00000000000000000000000000000000000000fb
ProofOfPossesionBytecode=`cat ./out-truffle-compat-0.8/ProofOfPossesionPrecompile.sol/ProofOfPossesionPrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url $ANVIL_RPC_URL $ProofOfPossesionAddress $ProofOfPossesionBytecode

NumberValidatorsInCurrentSetPrecompileAddress=0x00000000000000000000000000000000000000f9
NumberValidatorsInCurrentSetPrecompileBytecode=`cat ./out-truffle-compat-0.8/NumberValidatorsInCurrentSetPrecompile.sol/NumberValidatorsInCurrentSetPrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url $ANVIL_RPC_URL $NumberValidatorsInCurrentSetPrecompileAddress $NumberValidatorsInCurrentSetPrecompileBytecode

ValidatorSignerAddressFromCurrentSetAddress=0x00000000000000000000000000000000000000fa
ValidatorSignerAddressFromCurrentSetBytecode=`cat ./out-truffle-compat-0.8/ValidatorSignerAddressFromCurrentSetPrecompile.sol/ValidatorSignerAddressFromCurrentSetPrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url $ANVIL_RPC_URL $ValidatorSignerAddressFromCurrentSetAddress $ValidatorSignerAddressFromCurrentSetBytecode
