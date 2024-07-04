#!/usr/bin/env bash
set -euo pipefail

# A small script to terminate any instance of anvil currently serving at localhost.

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

if nc -z localhost $ANVIL_PORT; then
  kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')
  echo "Killed Anvil"
fi