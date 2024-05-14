#!/usr/bin/env bash
set -euo pipefail

forge test --fork-url http://127.0.0.1:$ANVIL_PORT --match-contract=IntegrationTest -vvv # || echo "Test failed" # TODO for some reason the echo didn't work