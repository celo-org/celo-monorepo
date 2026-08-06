#!/usr/bin/env bash
#
# execute-withdrawals.sh — Steps [1] + [2] of the sequencer-fee distribution.
#
#   [1] vault.withdraw()                 — native CELO  -> Operations Safe
#   [2] feeHandler.handleAll()           — base-fee CELO -> beneficiaries
#       feeHandler.distribute(token) x5  — each stablecoin -> beneficiaries
#
# Both steps are PERMISSIONLESS (anyone can call). They only move fees to the
# designated beneficiaries; they do NOT distribute to Governance (that is the
# 2-of-5 Safe batch, step [4]).
#
# Modes:
#   --fork       Spin up a local anvil fork of Celo mainnet and run there with a
#                throwaway test key. Safe. Default if no mode is given.
#   --mainnet    Broadcast to the RPC in $RPC_URL using $PK. Guarded: requires
#                EXECUTE_MAINNET=1 and an interactive "yes" confirmation.
#
# Env:
#   RPC_URL   Celo RPC for --mainnet (default https://forno.celo.org)
#   PK        Private key for --mainnet (NEVER paste a key into a chat/log)
#
# Exit code 0 only if every step succeeds and all balance deltas reconcile.

set -euo pipefail

VAULT=0x4200000000000000000000000000000000000011
FH=0xcD437749E43A154C07F3553504c68fBfD56B8778
SAFE=0x7A1E98FC9a008107DbD1f430a05Ace8cf6f3FE19
CELO=0x471EcE3750Da237f93B8E339c536989b8978a438

# token:address:decimals — the five fee-currency stablecoins in FeeHandler
STABLES=(
  "USDT:0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e:6"
  "USDC:0xcebA9300f2b948710d2653dD7B07f33A8B32118C:6"
  "USDm:0x765DE816845861e75A25fCA122bb6898B8B1282a:18"
  "EURm:0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73:18"
  "BRLm:0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787:18"
)

MODE="fork"
FORK_PORT=8546
ANVIL_PID=""

for arg in "$@"; do
  case "$arg" in
    --fork)    MODE="fork" ;;
    --mainnet) MODE="mainnet" ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

cleanup() { [[ -n "$ANVIL_PID" ]] && kill "$ANVIL_PID" 2>/dev/null || true; }
trap cleanup EXIT

# ---- Mode setup -----------------------------------------------------------
if [[ "$MODE" == "fork" ]]; then
  UPSTREAM="${RPC_URL:-https://forno.celo.org}"
  RPC="http://localhost:${FORK_PORT}"
  echo ">> Forking Celo mainnet from $UPSTREAM ..."
  pkill -f "anvil.*${FORK_PORT}" 2>/dev/null || true; sleep 1
  anvil --fork-url "$UPSTREAM" --port "$FORK_PORT" --silent --no-storage-caching >/tmp/anvil-exec.log 2>&1 &
  ANVIL_PID=$!
  sleep 5
  # Throwaway anvil dev key #0 (well-known, fork-only)
  PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  DEV=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  cast rpc anvil_setBalance "$DEV" 0x21e19e0c9bab2400000 --rpc-url "$RPC" >/dev/null  # 10000 CELO for gas
  echo ">> Fork ready at block $(cast block-number --rpc-url "$RPC")"
else
  RPC="${RPC_URL:-https://forno.celo.org}"
  : "${PK:?Set PK to a private key (use a key never pasted into a chat)}"
  if [[ "${EXECUTE_MAINNET:-0}" != "1" ]]; then
    echo "REFUSING mainnet: set EXECUTE_MAINNET=1 to broadcast real transactions." >&2
    exit 3
  fi
  echo "!! MAINNET MODE — these transactions are IRREVERSIBLE."
  echo "!! RPC=$RPC  signer=$(cast wallet address --private-key "$PK")"
  read -r -p '!! Type "yes" to broadcast: ' ans
  [[ "$ans" == "yes" ]] || { echo "Aborted."; exit 4; }
fi

# ---- Helpers --------------------------------------------------------------
celo_bal()  { cast balance "$1" --rpc-url "$RPC"; }                                   # wei
tok_bal()   { cast call "$1" "balanceOf(address)(uint256)" "$2" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}'; }
fmt()       { python3 -c "print(f'{int(\"${1:-0}\")/10**${2:-18}:,.2f}')"; }
send()      { cast send "$@" --rpc-url "$RPC" --private-key "$PK" --json 2>/dev/null | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])'; }

PASS=0; FAIL=0
check() { # label expected actual  (integer wei compare, tolerance 1e15 = 0.001)
  python3 - "$2" "$3" <<'PY' && { echo "   PASS  $1"; PASS=$((PASS+1)); } || { echo "   FAIL  $1 (exp $2 got $3)"; FAIL=$((FAIL+1)); }
import sys
exp, got = int(sys.argv[1]), int(sys.argv[2])
sys.exit(0 if abs(exp-got) <= 10**15 else 1)
PY
}

echo
echo "================ STEP [1]+[2] EXECUTION ($MODE) ================"

# ---- Snapshot BEFORE (indexed arrays, parallel to STABLES — bash 3.2 safe) ----
SAFE_CELO0=$(celo_bal "$SAFE"); VAULT_CELO0=$(celo_bal "$VAULT"); FH_CELO0=$(celo_bal "$FH")
FH_S0=(); SAFE_S0=()
for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"; FH_S0+=("$(tok_bal "$a" "$FH")"); SAFE_S0+=("$(tok_bal "$a" "$SAFE")"); done

echo "BEFORE:"
echo "  Vault CELO      : $(fmt "$VAULT_CELO0" 18)"
echo "  FeeHandler CELO : $(fmt "$FH_CELO0" 18)"
echo "  Safe CELO       : $(fmt "$SAFE_CELO0" 18)"
i=0; for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"
  printf "  %-5s FeeH=%-14s Safe=%-14s\n" "$s" "$(fmt "${FH_S0[$i]}" "$d")" "$(fmt "${SAFE_S0[$i]}" "$d")"; i=$((i+1)); done

# ---- [1] withdraw ----
echo
echo "[1] vault.withdraw() ............ status $(send "$VAULT" 'withdraw()' --gas-limit 3000000)"

# ---- [2] handleAll + distribute each stable ----
echo "[2] feeHandler.handleAll() ...... status $(send "$FH" 'handleAll()' --gas-limit 8000000)"
for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"
  echo "    distribute($s) ............. status $(send "$FH" 'distribute(address)' "$a" --gas-limit 5000000)"; done

# ---- Snapshot AFTER ----
SAFE_CELO1=$(celo_bal "$SAFE"); VAULT_CELO1=$(celo_bal "$VAULT")
FH_S1=(); SAFE_S1=()
for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"; FH_S1+=("$(tok_bal "$a" "$FH")"); SAFE_S1+=("$(tok_bal "$a" "$SAFE")"); done

echo
echo "AFTER:"
echo "  Vault CELO      : $(fmt "$VAULT_CELO1" 18)   (should be 0)"
echo "  Safe CELO native: $(fmt "$SAFE_CELO1" 18)"
i=0; for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"
  printf "  %-5s FeeH=%-14s Safe=%-14s\n" "$s" "$(fmt "${FH_S1[$i]}" "$d")" "$(fmt "${SAFE_S1[$i]}" "$d")"; i=$((i+1)); done

# ---- Reconciliation ----
echo
echo "RECONCILIATION:"
check "vault native CELO drained to 0" 0 "$VAULT_CELO1"
i=0; for e in "${STABLES[@]}"; do IFS=: read -r s a d <<<"$e"
  check "FeeHandler $s drained to 0" 0 "${FH_S1[$i]}"
  moved=$(python3 -c "print(int('${SAFE_S1[$i]}')-int('${SAFE_S0[$i]}'))")
  check "Safe $s += FeeHandler amount" "${FH_S0[$i]}" "$moved"
  i=$((i+1)); done

echo
echo "Result: $PASS passed, $FAIL failed."
[[ "$FAIL" -eq 0 ]] || exit 1
