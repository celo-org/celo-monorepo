#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh


ANVIL_PORT=$ANVIL_OP_PORT
USE_CELO=""

# Parse command line options:
#   --celo: Enable Celo mode in Anvil
#   -p: Custom port number for Anvil to listen on (overrides default ANVIL_PORT)
#   -l: Path to load existing Anvil state from (instead of creating new state)

# Check for --celo flag first (long option)
for arg in "$@"; do
  if [ "$arg" = "--celo" ]; then
    USE_CELO="--celo"
    break
  fi
done

# Filter out --celo from arguments before getopts processing
FILTERED_ARGS=()
for arg in "$@"; do
  if [ "$arg" != "--celo" ]; then
    FILTERED_ARGS+=("$arg")
  fi
done
if [ ${#FILTERED_ARGS[@]} -gt 0 ]; then
  set -- "${FILTERED_ARGS[@]}"
else
  set --
fi

while getopts 'p:l:' flag; do
  case "${flag}" in
    p) CUSTOM_PORT="${OPTARG}" ;;
    l) LOAD_STATE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

if [ -n "${CUSTOM_PORT:-}" ]; then
  ANVIL_PORT=$CUSTOM_PORT
fi

ANVIL_RPC_URL=$(get_anvil_rpc_url)

timestamp=`date -Iseconds`

mkdir -p $ANVIL_FOLDER

# create package.json
echo "{\"name\": \"@celo/devchain-anvil\",\"version\": \"1.0.0\",\"repository\": { \"url\": \"https://github.com/celo-org/celo-monorepo\", \"directory\": \"packages/protocol/migrations_sol\" },\"homepage\": \"https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/migrations_sol/README.md\",\"description\": \"Anvil based devchain that contains core smart contracts of celo\",\"author\":\"Celo\",\"license\": \"LGPL-3.0\"}" > $TMP_FOLDER/package.json

cp $PWD/migrations_sol/README.md $TMP_FOLDER/README.md

if nc -z localhost $ANVIL_PORT; then
  echo "Port already used"
  kill $(lsof -t -i:$ANVIL_PORT)
  sleep 5
  echo "Killed previous Anvil"
fi

# Start anvil
if [ -n "${LOAD_STATE:-}" ]; then
  echo "Loading Anvil state from $LOAD_STATE"
  STATE_FLAGS="--load-state $LOAD_STATE"
else
  echo "Anvil state will be saved to $ANVIL_FOLDER"
  STATE_FLAGS="--dump-state $ANVIL_FOLDER --state-interval $STATE_INTERVAL"
fi

$ANVIL \
  $USE_CELO \
  --port $ANVIL_PORT \
  $STATE_FLAGS \
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
cast rpc anvil_setLoggingEnabled $ANVIL_LOGGING_ENABLED --rpc-url $ANVIL_RPC_URL

echo "Anvil launched"
sleep 1
