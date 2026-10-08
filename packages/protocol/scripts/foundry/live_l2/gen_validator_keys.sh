#!/usr/bin/env bash
set -euo pipefail

### Generates the validator key material for a testnet and stores it in OpenBao, one secret per key with
### the field "value". Private material never touches disk, argv or stdout; only addresses are printed.
###   3 validator groups + 6 validators (the accounts that lock CELO and register), and the mnemonic the
###   migration derives the 6 validator signer keys from.
### Existing secrets are kept, so the script can be re-run.
###
### usage: gen_validator_keys.sh <openbao prefix>      e.g. secrets/static-secrets/devops-circle/<testnet>
### Requires: cast, jq, bao (logged in, with write access to the prefix).

PREFIX=${1:?usage: gen_validator_keys.sh <openbao prefix>}

exists() { bao kv metadata get "$PREFIX/$1" >/dev/null 2>&1; }
put() { printf '%s' "$2" | bao kv put "$PREFIX/$1" value=- >/dev/null; } # value from stdin, not argv

for NAME in VALIDATOR_GROUP_0 VALIDATOR_GROUP_1 VALIDATOR_GROUP_2 \
  VALIDATOR_0 VALIDATOR_1 VALIDATOR_2 VALIDATOR_3 VALIDATOR_4 VALIDATOR_5; do
  if exists "${NAME}_PRIVATE_KEY"; then
    echo "  ${NAME}: already present, kept"
    continue
  fi
  JSON="$(cast wallet new --json)"
  put "${NAME}_PRIVATE_KEY" "$(printf '%s' "$JSON" | jq -r '.[0].private_key')"
  put "${NAME}_ADDRESS" "$(printf '%s' "$JSON" | jq -r '.[0].address')"
  printf '  %-18s %s\n' "$NAME" "$(printf '%s' "$JSON" | jq -r '.[0].address')"
  unset JSON
done

if exists VALIDATOR_SIGNERS_MNEMONIC; then
  echo "  VALIDATOR_SIGNERS_MNEMONIC: already present, kept"
else
  JSON="$(cast wallet new-mnemonic --words 24 --json)"
  put VALIDATOR_SIGNERS_MNEMONIC "$(printf '%s' "$JSON" | jq -r '.mnemonic')"
  unset JSON
  echo "  VALIDATOR_SIGNERS_MNEMONIC stored (24 words)"
fi
