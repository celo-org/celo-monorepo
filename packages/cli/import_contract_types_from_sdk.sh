#!/usr/bin/env bash
set -euo pipefail

environment="$1"

yarn --cwd=../walletkit build $environment

rm -rf ./src/generated
mkdir -p ./src/generated/contracts
mkdir -p ./src/generated/types
cp ../walletkit/contracts/*.ts ./src/generated/contracts
cp ../walletkit/types/*.d.ts ./src/generated/types

