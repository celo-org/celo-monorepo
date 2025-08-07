#!/usr/bin/env bash
set -euo pipefail

# A small script to terminate any instance of anvil currently serving at localhost.

# Default behavior: delete tmp state unless overridden
DELETE_STATE=true

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --keep-state)
      DELETE_STATE=false
      shift # past argument
      ;;
    *)    # unknown option
      echo "Unknown option: $1"
      # Optionally exit here if only known flags should be allowed
      shift # past argument
      ;;
  esac
done

if [ "$DELETE_STATE" = false ]; then
  echo "Anvil temporary state will NOT be deleted (--keep-state specified)."
fi

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

if nc -z localhost $ANVIL_PORT; then
  kill $(lsof -t -i:$ANVIL_PORT)
  echo "Killed Anvil"
fi

# Conditionally remove anvil tmp state
ANVIL_TMP_DIR="$HOME/.foundry/anvil/tmp"
if [ "$DELETE_STATE" = true ]; then
  if [ -d "$ANVIL_TMP_DIR" ]; then
    echo "Removing anvil temporary state directory: $ANVIL_TMP_DIR"
    rm -rf "$ANVIL_TMP_DIR"/*
    echo "Anvil temporary state removed."
  else
    echo "Anvil temporary state directory not found: $ANVIL_TMP_DIR"
  fi
else
  echo "Skipping removal of anvil temporary state."
fi
