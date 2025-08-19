source "./scripts/bash/ffi/ffi-script.sh"

echo "in compile test case"

RESOURCES_BASE=test-sol-resources/compatibility
FOUNDRY_CONFIG="$RESOURCES_BASE/foundry.toml"
CASE_NAME=$1
CONTRACTS_DIR="$RESOURCES_BASE/contracts_$CASE_NAME"

echo "set vars"

if [[ ! -d "$CONTRACTS_DIR" ]]; then
  echo "Couldn't find contracts for test case \"$CASE_NAME\"" >&2
  echo "Tried: $CONTRACTS_DIR" >&2
  exit 1
else
  OUT_DIR="build/out_$CASE_NAME"

  echo "Building to $OUT_DIR"

  forge build --config-path "$FOUNDRY_CONFIG" --out "$OUT_DIR" --ast $CONTRACTS_DIR
fi
