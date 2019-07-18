#!/usr/bin/env bash
set -euo pipefail

environment="$1"

yarn --cwd=../contractkit build $environment

rm -rf ./src/generated
mkdir -p ./src/generated/contracts
mkdir -p ./src/generated/types
cp ../contractkit/contracts/*.ts ./src/generated/contracts
cp ../contractkit/types/*.d.ts ./src/generated/types

