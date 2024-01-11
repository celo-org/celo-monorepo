#!/usr/bin/env bash
set -euo pipefail


# TODO move me to another folder
# Compile everything

forge compile
anvil &

# set cheat codes, likely with another script


# run migrations
 forge script migrations_sol/Migration.s.sol --rpc-url http://127.0.0.1:8545 -vvv # -- broadcast

# forge test --fork-url http://127.0.0.1:8545