#!/usr/bin/env bash
set -euo pipefail


# TODO move me to another folder
# Compile everything

anvil

# set cheat codes


# run migrations
#  forge script migrations_sol/Migration.s.sol --rpc-url http://127.0.0.1:8545 -vvv

# forge test --fork-url integration tests and migrations