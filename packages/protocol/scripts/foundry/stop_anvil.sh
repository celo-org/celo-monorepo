#!/usr/bin/env bash
set -euo pipefail

# A small script to terminate any instance of anvil currently serving at localhost.

ANVIL_PORT=8546

if nc -z localhost $ANVIL_PORT; then
  kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')
  echo "Killed Anvil"
fi