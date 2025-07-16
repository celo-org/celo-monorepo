#!/usr/bin/env bash
set -euo pipefail

echo "Starting local anvil devchain."
source $PWD/scripts/foundry/start_anvil.sh

echo "Deploying libraries to local anvil devchain."
source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags are: $LIBRARY_FLAGS"

EXTRA_OUTPUT_FLAGS="--extra-output abi --extra-output devdoc --extra-output userdoc --extra-output metadata --extra-output storageLayout"
EXTRA_OUTPUT_FLAGS="$EXTRA_OUTPUT_FLAGS --extra-output evm.bytecode.object --extra-output evm.bytecode.sourceMap --extra-output evm.bytecode.linkReferences --extra-output evm.bytecode.generatedSources"
EXTRA_OUTPUT_FLAGS="$EXTRA_OUTPUT_FLAGS --extra-output evm.deployedBytecode.object --extra-output evm.deployedBytecode.sourceMap --extra-output evm.deployedBytecode.linkReferences --extra-output evm.deployedBytecode.generatedSources --extra-output evm.deployedBytecode.immutableReferences"
EXTRA_OUTPUT_FLAGS="$EXTRA_OUTPUT_FLAGS --extra-output evm.methodIdentifiers --extra-output evm.gasEstimates"
echo "Extra output flags are: $EXTRA_OUTPUT_FLAGS"

echo "Building source code with libraries from local anvil devchain."
FOUNDRY_PROFILE=devchain forge build --ast $EXTRA_OUTPUT_FLAGS $LIBRARY_FLAGS

echo "Stopping local anvil devchain."
source $PWD/scripts/foundry/stop_anvil.sh

echo "Iterating over generated artifacts to extract ABI and Bytecode files."
find out -name "*.json" -print0 | while read -d '' contractArtifact; do
  contractDirectory=$(echo "${contractArtifact%/*}")
  artifactFile=$(basename $contractArtifact)
  contractName=$(echo "${artifactFile%.*}")
  echo "Processing $contractName: file $artifactFile exists in $contractDirectory"
  cat $contractArtifact | jq -r .abi > "$contractDirectory/$contractName.abi.json"
  cat $contractArtifact | jq -r .bytecode.object > "$contractDirectory/$contractName.bytecode"
done
echo "Done extracting ABI and Bytecode files."
echo "ABI files located in \"out/{contractFileDir}/{contractName}.abi.json\""
echo "Bytecode files located in \"out/{contractFileDir}/{contractName}.bytecode\""
