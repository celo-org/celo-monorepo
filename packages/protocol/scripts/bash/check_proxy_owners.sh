#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${RPC_URL:-http://localhost:8546}"

# Pull Contract + Proxy columns from `celocli network:contracts`.
# Output rows look like: ` Accounts   0x1dDF...   0x08c0...   1.2.0.0 `
# Filter to lines whose 2nd field is an 0x address.
mapfile -t PROXIES < <(
  celocli network:contracts --node "$RPC_URL" 2>/dev/null \
    | awk '$2 ~ /^0x[0-9a-fA-F]{40}$/ { print $1, $2 }'
)

if [[ ${#PROXIES[@]} -eq 0 ]]; then
  echo "No proxies parsed from celocli network:contracts (RPC: $RPC_URL)" >&2
  exit 1
fi

printf "%-25s %-44s %s\n" "Contract" "Proxy" "Owner"
printf "%-25s %-44s %s\n" "-------------------------" "--------------------------------------------" "------------------------------------------"

for entry in "${PROXIES[@]}"; do
  name=$(awk '{print $1}' <<<"$entry")
  proxy=$(awk '{print $2}' <<<"$entry")
  if owner=$(cast call "$proxy" "owner()(address)" --rpc-url "$RPC_URL" 2>/dev/null); then
    printf "%-25s %-44s %s\n" "$name" "$proxy" "$owner"
  else
    printf "%-25s %-44s %s\n" "$name" "$proxy" "ERROR"
  fi
done
