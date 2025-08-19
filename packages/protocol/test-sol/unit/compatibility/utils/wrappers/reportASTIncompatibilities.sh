source ./scripts/bash/ffi/ffi-script.sh

OLD=$1
NEW=$2

ts-node test-sol/unit/compatibility/utils/wrappers/reportASTIncompatibilities.ts "$OLD" "$NEW" "$FFI_JSON_OUTPUT"
