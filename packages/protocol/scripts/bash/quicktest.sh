#!/usr/bin/env bash

# Use this script if you want quick test iterations.
# Compared to the normal test command, this script will:
# 1. not run the pretest script of building solidity (will still be run as part of truffle test)
#    and compiling typescript. This works because truffle can run typescript "natively".
# 2. only migrate selected migrations as set in `backupmigrations.sh` (you'll likely need at
#    least one compilation step since truffle seems to only run compiled migrations)
#

rm test/**/*.js
./scripts/bash/backupmigrations.sh
node runTests.js "$@"
./scripts/bash/backupmigrations.sh
