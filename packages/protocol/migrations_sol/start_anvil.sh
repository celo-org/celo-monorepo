#!/usr/bin/env bash
set -euo pipefail

timestamp=`date -Iseconds`
ANVI_FILE="anvil_state-$timestamp"

if nc -z localhost $ANVIL_PORT; then
  echo "Port already used"
  # TODO aff flag to kill the process using the port
  kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')
  echo "Killed previous Anvil"
fi

# --disable-default-create2-deployer --no-rate-limit
anvil --port $ANVIL_PORT --gas-limit 50000000 --steps-tracing --code-size-limit 245760 --balance 60000 --dump-state $ANVI_FILE &
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