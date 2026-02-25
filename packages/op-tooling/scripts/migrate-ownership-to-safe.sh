#!/bin/sh
#
# Migrates OP Stack L1 contract ownership from an EOA to a Gnosis Safe.
# Performs: ProxyAdmin, SystemConfig, DisputeGameFactory ownership transfers
#           + SuperchainConfig proxy admin migration.
#
# Required env vars:
#   L1_RPC_URL  - L1 RPC endpoint
#   OP_DIR      - Path to optimism repository root
#   PK          - Private key of the current owner EOA
#   NETWORK     - Network identifier (chaos)
#   NEW_SAFE    - Address of the target Gnosis Safe

set -euo pipefail

check_env_var() {
    local var_name=$1
    local var_value=${!var_name:-}

    if [ -z "$var_value" ]; then
        echo "ERROR: $var_name is not set"
        echo "Please export $var_name before running this script"
        exit 1
    fi
}

echo "=== Migrate Ownership to Safe ==="
echo ""
echo "Checking environment variables..."
check_env_var "L1_RPC_URL"
check_env_var "OP_DIR"
check_env_var "PK"
check_env_var "NETWORK"
check_env_var "NEW_SAFE"

echo "  Network:  $NETWORK"
echo "  New Safe: $NEW_SAFE"
echo "  RPC URL:  $L1_RPC_URL"
echo ""

forge script MigrateOwnershipToSafe.s.sol \
  --rpc-url "$L1_RPC_URL" \
  --root "$OP_DIR/packages/contracts-bedrock" \
  --private-key "$PK" \
  --broadcast
