#!/bin/sh

set -euo pipefail

check_env_var() {
    local var_name=$1
    local var_value=${!var_name:-}
    
    if [ -z "$var_value" ]; then
        print_error "$var_name is not set"
        echo "Please export $var_name while running this script"
        exit 1
    fi
}

echo "Checking environment variables..."
check_env_var "L1_RPC_URL"
check_env_var "OP_DIR"
check_env_var "PK"

echo "Closing recent fault dispute game..."
forge script CloseRecentGame.s.sol \
  --rpc-url $L1_RPC_URL \
  --root $OP_DIR/packages/contracts-bedrock \
  --private-key $PK \
  --broadcast
