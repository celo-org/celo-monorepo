#!/usr/bin/env bash
set -euo pipefail

: '
  The following runs specific integration tests.
  '
# Run integration tests
forge test \
--match-contract=IntegrationTest \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

: '
  The following tests assert that existing unit tests pass when run against the migrated anvil fork.
  These are necessary, but not sufficient requirements.
  The idea is that existing unit tests, which are known to pass in a testing environment, should
  also pass if they are run against the devchain using the "--fork-url" flag.
  '
# Run tests common
# can't use gas limit because some setUp function use more than the limit
forge test \
--match-path "test-sol/common/*" \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Run tests governance/network
forge test \
--match-path "test-sol/governance/network/*" \
--block-gas-limit 50000000 \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Run tests governance/validators
forge test \
--match-path "test-sol/governance/validators/*" \
--block-gas-limit 50000000 \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT
      
# Run tests governance/voting
# can't use gas limit because some setUp function use more than the limit
forge test \
--match-path "test-sol/governance/voting/*" \
--block-gas-limit 50000000 \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Run tests stability
forge test \
--match-path "test-sol/stability/*" \
--block-gas-limit 50000000 \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Run tests identity
forge test \
--match-path "test-sol/identity/*" \
--block-gas-limit 50000000 \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Run Everything just in case something was missed
# can't use gas limit because some setUp function use more than the limit
forge test \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT #TODO this should ignore integration tests
