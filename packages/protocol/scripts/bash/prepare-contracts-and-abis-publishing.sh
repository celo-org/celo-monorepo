#!/usr/bin/env bash
set -euo pipefail

mkdir -p ./build/contracts/types
ts-node ./scripts/build.ts --ethersTypes ./build/contracts/types/ethers
ts-node ./scripts/build.ts --web3Types ./build/contracts/types/web3
ts-node ./scripts/build.ts --truffleTypes ./build/contracts/types/truffle
 
cp ./contracts/package.abis.json ./build/contracts/package.json
cp ./contracts/README.abis.md ./build/contracts/README.md
