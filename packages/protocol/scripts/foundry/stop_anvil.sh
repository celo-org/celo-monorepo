#!/usr/bin/env bash
set -euo pipefail

# A small script to terminate any instance of anvil currently serving at localhost.

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

if nc -z localhost $ANVIL_PORT; then
  kill $(lsof -t -i:$ANVIL_PORT)
  echo "Killed Anvil"
fi