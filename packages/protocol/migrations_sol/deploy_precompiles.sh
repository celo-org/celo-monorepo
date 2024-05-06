#!/usr/bin/env bash
set -euo pipefail

echo "Deploying precompiles:"


# TODO insteadl of deploying one by one
EpochSizeAddress=0x00000000000000000000000000000000000000f8
EpochSizeBytecode=`cat ./out/EpochSizePrecompile.sol/EpochSizePrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url http://127.0.0.1:$ANVIL_PORT $EpochSizeAddress $EpochSizeBytecode

ProofOfPossesionAddress=0x00000000000000000000000000000000000000fb
ProofOfPossesionBytecode=`cat ./out/ProofOfPossesionPrecompile.sol/ProofOfPossesionPrecompile.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url http://127.0.0.1:$ANVIL_PORT $ProofOfPossesionAddress $ProofOfPossesionBytecode