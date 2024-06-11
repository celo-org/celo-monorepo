#!/usr/bin/env bash
set -euo pipefail

timestamp=`date -Iseconds`
TMP_FOLDER="$PWD/.tmp"
ANVIL_FOLDER="$TMP_FOLDER/devchain"
mkdir -p $ANVIL_FOLDER
echo "Anvil state will be saved to $ANVIL_FOLDER"

# create package.json
echo "{\"name\": \"@celo/devchain-anvil\",\"version\": \"1.0.0\",\"repository\": { \"url\": \"https://github.com/celo-org/celo-monorepo\", \"directory\": \"packages/protocol/migrations_sol\" },\"homepage\": \"https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/migrations_sol/README.md\",\"description\": \"Anvil based devchain that contains core smart contracts of celo\",\"author\":\"Celo\",\"license\": \"LGPL-3.0\"}" > $TMP_FOLDER/package.json

cp $PWD/migrations_sol/README.md $TMP_FOLDER/README.md

if nc -z localhost $ANVIL_PORT; then
  echo "Port already used"
  kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')
  echo "Killed previous Anvil"
fi

anvil --port $ANVIL_PORT --gas-limit 50000000 --steps-tracing --code-size-limit 245760 --balance 60000 --dump-state $ANVIL_FOLDER --state-interval 1 &

# alternatively:
# ANVIL_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`

export ANVIL_PID=$!

echo "Waiting Anvil to launch on $ANVIL_PORT..."


while ! nc -z localhost $ANVIL_PORT; do
  sleep 0.1 # wait for 1/10 of the second before check again
done

# enabled logging
cast rpc anvil_setLoggingEnabled true --rpc-url http://127.0.0.1:$ANVIL_PORT

echo "Anvil launched"
sleep 1
