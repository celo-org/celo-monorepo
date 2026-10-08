#!/usr/bin/env bash
set -euo pipefail

### Runs the core contracts migration against a live L2.
### Adapted from create_and_migrate_anvil_devchain.sh. Differences:
###  - no anvil cheats: the Registry proxy (0x...ce10) and the four fixed proxies listed under
###    `.proxies` in the config must already exist in the chain's genesis, owned by the deployer
###  - every key comes from the environment (nothing secret on disk or in argv)
###  - libraries are deployed by a forge script instead of `forge create --unlocked`
###
### Required env: RPC_URL, MIGRATION_CONFIG, DEPLOYER_ADDRESS, DEPLOYER_PRIVATE_KEY, VALIDATOR_KEYS (comma
### separated: groups first, then validators), VALIDATOR_SIGNERS_MNEMONIC.
### Optional: STEPS (default "libraries migration after") to resume from a later step; MIGRATION_VERBOSITY
### (e.g. -vv) to override the forge verbosity.

: "${RPC_URL:?}" "${MIGRATION_CONFIG:?}" "${DEPLOYER_ADDRESS:?}" "${DEPLOYER_PRIVATE_KEY:?}" "${VALIDATOR_KEYS:?}" "${VALIDATOR_SIGNERS_MNEMONIC:?}"
STEPS=${STEPS:-"libraries migration after"}

# Library lists, script paths and tool names come from the same constants the devchain flow uses.
source $PWD/scripts/foundry/constants.sh
# -vvv prints call traces when a script fails, and those include cheatcode arguments (keys). Allow less.
VERBOSITY_LEVEL=${MIGRATION_VERBOSITY:-$VERBOSITY_LEVEL}

CHAIN_ID=$($CAST chain-id --rpc-url $RPC_URL)
FLAGS_FILE=$TMP_FOLDER/library_flags_$CHAIN_ID.txt
FORGE_SCRIPT_FLAGS="--rpc-url $RPC_URL --sender $DEPLOYER_ADDRESS --broadcast --slow $NON_INTERACTIVE $VERBOSITY_LEVEL"
echo "Forge version: $($FORGE --version | head -1) | chain id: $CHAIN_ID | steps: $STEPS"

# foundry won't compile 0.5 dependencies without this file
cp test-sol/devchain/Import05Dependencies.sol contracts
trap 'rm -f contracts/Import05Dependencies.sol' EXIT

if [[ " $STEPS " == *" libraries "* ]]; then
  FOUNDRY_PROFILE=truffle-compat $FORGE build
  FOUNDRY_PROFILE=truffle-compat8 $FORGE build

  # Isolated library project, as in deploy_libraries.sh
  rm -rf "$TEMP_DIR" && mkdir -p "$TEMP_DIR"
  for LIB_PATH in "${LIBRARIES_PATH[@]}" "${LIBRARIES_PATH_08[@]}"; do
    SOURCE=${LIB_PATH%%:*}
    mkdir -p "$TEMP_DIR/$(dirname $SOURCE)" && cp "$SOURCE" "$TEMP_DIR/$SOURCE"
  done
  for DEP in "${LIBRARY_DEPENDENCIES_PATH[@]}"; do
    mkdir -p "$TEMP_DIR/$(dirname $DEP)" && cp "$DEP" "$TEMP_DIR/$DEP"
  done
  cp foundry.toml remappings.txt "$TEMP_DIR/"
  (cd "$TEMP_DIR" && FOUNDRY_PROFILE=truffle-compat $FORGE build && FOUNDRY_PROFILE=truffle-compat8 $FORGE build)

  ARTIFACTS=()
  for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    ARTIFACTS+=(".tmp/libraries/out-truffle-compat/$(basename ${LIB_PATH%%:*})/${LIB_PATH#*:}.json")
  done
  for LIB_PATH in "${LIBRARIES_PATH_08[@]}"; do
    ARTIFACTS+=(".tmp/libraries/out-truffle-compat-0.8/$(basename ${LIB_PATH%%:*})/${LIB_PATH#*:}.json")
  done

  echo "Deploying libraries..."
  LIBRARY_ARTIFACTS=$(IFS=,; echo "${ARTIFACTS[*]}") $FORGE script migrations_sol/DeployLibraries.s.sol \
    --target-contract DeployLibraries --sig "run()" $FORGE_SCRIPT_FLAGS

  # Addresses in deployment order, from the broadcast record
  mapfile -t ADDRESSES < <(jq -r '.transactions[].contractAddress' broadcast/DeployLibraries.s.sol/$CHAIN_ID/run-latest.json)
  [ "${#ADDRESSES[@]}" -eq "${#ARTIFACTS[@]}" ] || { echo "expected ${#ARTIFACTS[@]} libraries, broadcast has ${#ADDRESSES[@]}"; exit 1; }
  LIBRARY_FLAGS=""; LIBRARY_FLAGS_08=""; i=0
  for LIB_PATH in "${LIBRARIES_PATH[@]}"; do LIBRARY_FLAGS+=" --libraries $LIB_PATH:${ADDRESSES[$i]}"; i=$((i + 1)); done
  for LIB_PATH in "${LIBRARIES_PATH_08[@]}"; do LIBRARY_FLAGS_08+=" --libraries $LIB_PATH:${ADDRESSES[$i]}"; i=$((i + 1)); done
  printf '%s\n%s\n' "$LIBRARY_FLAGS" "$LIBRARY_FLAGS_08" > $FLAGS_FILE
fi

LIBRARY_FLAGS=$(sed -n 1p $FLAGS_FILE); LIBRARY_FLAGS_08=$(sed -n 2p $FLAGS_FILE)
echo "Library flags 0.5 are: $LIBRARY_FLAGS"
echo "Library flags 0.8 are: $LIBRARY_FLAGS_08"

# Selectors map for the constitution, then all contracts linked against the deployed libraries
source $PWD/scripts/foundry/build_constitution_selectors_map.sh
FOUNDRY_PROFILE=truffle-compat $FORGE build $LIBRARY_FLAGS
FOUNDRY_PROFILE=truffle-compat8 $FORGE build $LIBRARY_FLAGS_08

if [[ " $STEPS " == *" migration "* ]]; then
  echo "Running migration script..."
  $FORGE script $MIGRATION_SCRIPT_PATH --target-contract $MIGRATION_TARGET_CONTRACT --sig "runMigration()" \
    $FORGE_SCRIPT_FLAGS $LIBRARY_FLAGS $LIBRARY_FLAGS_08 || { echo "Migration script failed"; exit 1; }
fi

if [[ " $STEPS " == *" after "* ]]; then
  echo "Running second part of migration script..."
  $FORGE script $MIGRATION_SCRIPT_PATH --target-contract $MIGRATION_TARGET_CONTRACT --sig "runAfterMigration()" \
    $FORGE_SCRIPT_FLAGS $LIBRARY_FLAGS $LIBRARY_FLAGS_08 || { echo "Migration script (part 2) failed"; exit 1; }
fi

echo "Migration finished."
