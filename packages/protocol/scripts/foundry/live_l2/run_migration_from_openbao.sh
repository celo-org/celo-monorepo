#!/usr/bin/env bash
set -euo pipefail

### Runs migrate_live_l2.sh with every key read from OpenBao straight into the environment.
### Run it from packages/protocol.
###
### Required env:
###   RPC_URL            RPC of the L2 (ideally the sequencer's execution client)
###   DEPLOYER_ADDRESS   address of the deployer / admin key
###   BAO_PREFIX         e.g. secrets/static-secrets/devops-circle/<testnet>; must hold ADMIN_PRIVATE_KEY
###                      and the secrets written by gen_validator_keys.sh
###   MIGRATION_CONFIG   e.g. ./migrations_sol/migrationsConfig.havoc.json
### Optional env:
###   SOLC_SHIM_HOME     compiler HOME built by solc_js_shim/setup.sh
###   STEPS, MIGRATION_VERBOSITY   passed to migrate_live_l2.sh (verbosity defaults to -vv here)

: "${RPC_URL:?}" "${DEPLOYER_ADDRESS:?}" "${BAO_PREFIX:?}" "${MIGRATION_CONFIG:?}"

export DEPLOYER_PRIVATE_KEY="$(bao kv get -field=value "$BAO_PREFIX/ADMIN_PRIVATE_KEY")"

# Order matters: the migration takes the first `groupCount` keys as groups, the rest as validators.
KEYS=()
for NAME in VALIDATOR_GROUP_0 VALIDATOR_GROUP_1 VALIDATOR_GROUP_2 \
  VALIDATOR_0 VALIDATOR_1 VALIDATOR_2 VALIDATOR_3 VALIDATOR_4 VALIDATOR_5; do
  KEYS+=("$(bao kv get -field=value "$BAO_PREFIX/${NAME}_PRIVATE_KEY")")
done
export VALIDATOR_KEYS=$(IFS=,; echo "${KEYS[*]}")
unset KEYS
export VALIDATOR_SIGNERS_MNEMONIC="$(bao kv get -field=value "$BAO_PREFIX/VALIDATOR_SIGNERS_MNEMONIC")"

# -vvv prints call traces when a script fails, and those include cheatcode arguments (the keys).
export MIGRATION_VERBOSITY=${MIGRATION_VERBOSITY:--vv}

# bao finds its token under the real HOME, so the compiler HOME is switched only after the secrets are read.
if [ -n "${SOLC_SHIM_HOME:-}" ]; then
  export HOME=$SOLC_SHIM_HOME
fi

./scripts/foundry/migrate_live_l2.sh
