#!/usr/bin/env bash
set -euo pipefail

# This script is meant to be run by CI and requires checked out Optimism repo.
OP_DIR=${OP_DIR:-}
if [ -z "$OP_DIR" ]; then
  echo "OP_DIR is not set. Please set it to the contracts-bedrock path of the Optimism repo."
  exit 1
fi

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

mkdir -p $ANVIL_FOLDER
echo "Anvil state will be saved to $ANVIL_FOLDER"

# create package.json & README.md (required in step: "Prepare package for publishing" in protocol-devchain-anvil.yml)
echo "{\"name\": \"@celo/devchain-anvil\",\"version\": \"1.0.0\",\"repository\": { \"url\": \"https://github.com/celo-org/celo-monorepo\", \"directory\": \"packages/protocol/migrations_sol\" },\"homepage\": \"https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/migrations_sol/README.md\",\"description\": \"Anvil based devchain that contains core smart contracts of celo\",\"author\":\"Celo\",\"license\": \"LGPL-3.0\"}" > $TMP_FOLDER/package.json
cp $PWD/migrations_sol/README.md $TMP_FOLDER/README.md

if nc -z localhost $ANVIL_PORT; then
  echo "Port already used"
  kill $(lsof -t -i:$ANVIL_PORT)
  sleep 5
  echo "Killed previous Anvil"
fi

# Start anvil
anvil \
--celo \
--port $ANVIL_PORT \
--load-state $OP_DIR/anvil-state.json \
--dump-state $ANVIL_FOLDER \
--state-interval $STATE_INTERVAL \
--gas-limit $GAS_LIMIT \
--code-size-limit $CODE_SIZE_LIMIT \
--balance $BALANCE \
--steps-tracing &
# For context "&" tells the shell to start a command as a background process.
# This allows you to continue executing other commands without waiting for the background command to finish.

# alternatively:
# ANVIL_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
export ANVIL_PID=$!

echo "Waiting Anvil to launch on $ANVIL_PORT..."
while ! nc -z localhost $ANVIL_PORT; do
  sleep 0.1 # wait for 1/10 of the second before check again
done

# enabled logging
cast rpc anvil_setLoggingEnabled true --rpc-url $ANVIL_RPC_URL

echo "Anvil launched"
sleep 1
