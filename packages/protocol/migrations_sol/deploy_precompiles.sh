#!/usr/bin/env bash
set -euo pipefail

echo "Deploying precompiles:"

EpochSizeAddress=0x00000000000000000000000000000000000000f8

EpochSizeBytecode=`cat ./out/EpochSizePrecompile.sol/EpochSizePrecompile.json | jq -r '.deployedBytecode.object'`

#echo "Bytecode: $EpochSizeBytecode"
cast rpc anvil_setCode --rpc-url http://127.0.0.1:$ANVIL_PORT $EpochSizeAddress $EpochSizeBytecode