#!/bin/bash
set -euo pipefail

# Resolves and closes fault dispute games. CloseRecentGame.s.sol only closes games that are
# already resolved and stops at the first one; nothing in this repo resolves an IN_PROGRESS
# game, which is what a chain with no challenger activity needs.
#
# resolve() and resolveClaim() are NOT gated by onlyAuthorized on PermissionedDisputeGame -
# only step() and move() are - so any account can settle an expired game.
#
# Two idempotent passes, because closeGame() requires the post-resolution airgap
# (disputeGameFinalityDelaySeconds) to have elapsed:
#   pass 1 - resolveClaim(0,0) + resolve() on games whose challenger clock has expired
#   pass 2 - closeGame() on resolved games past the airgap, which advances the anchor
# Run it once to resolve, then again after the airgap to close.

# Required environment variables
L1_RPC_URL=${L1_RPC_URL:-}; [ -z "${L1_RPC_URL:-}" ] && echo "Need to set the L1_RPC_URL via env" && exit 1;
FACTORY=${FACTORY:-}; [ -z "${FACTORY:-}" ] && echo "Need to set the FACTORY via env" && exit 1;
REGISTRY=${REGISTRY:-}; [ -z "${REGISTRY:-}" ] && echo "Need to set the REGISTRY via env" && exit 1;

# Optional environment variables
PK=${PK:-}
DRY_RUN=${DRY_RUN:-false}
FROM_INDEX=${FROM_INDEX:-0}
TO_INDEX=${TO_INDEX:-}
LIMIT=${LIMIT:-0}
SKIP_RESOLVE=${SKIP_RESOLVE:-false}
SKIP_CLOSE=${SKIP_CLOSE:-false}

[ "$DRY_RUN" != "true" ] && [ -z "$PK" ] && echo "Need to set the PK via env (or DRY_RUN=true)" && exit 1;

call() { cast call "$1" "$2" ${3:-} --rpc-url "$L1_RPC_URL" 2>/dev/null | sed 's/ .*//'; }

# Gas is left to the node: closeGame() needs ~377k and a hardcoded cap reverts it out-of-gas.
# Receipt status is checked because cast send exits 0 even when the transaction reverted.
send() {
  local target=$1
  shift
  if [ "$DRY_RUN" = "true" ]; then
    echo "        [dry-run] would send $1"
    return 0
  fi
  local out status
  if ! out=$(cast send "$target" "$@" --rpc-url "$L1_RPC_URL" --private-key "$PK" --json 2>&1); then
    echo "        send failed: $(echo "$out" | tr -d '\n' | head -c 140)"
    return 1
  fi
  status=$(echo "$out" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status",""))' 2>/dev/null || echo "")
  if [ "$status" != "0x1" ]; then
    echo "        tx REVERTED (status=${status:-unknown})"
    return 1
  fi
  return 0
}

GAME_COUNT=$(call "$FACTORY" "gameCount()(uint256)")
LAST=${TO_INDEX:-$((GAME_COUNT - 1))}

echo "Factory   : $FACTORY"
echo "Registry  : $REGISTRY"
echo "Games     : $GAME_COUNT (scanning $FROM_INDEX..$LAST)"
echo "Dry run   : $DRY_RUN"
echo

RESOLVED=0
CLOSED=0
ACTED=0

i=$FROM_INDEX
while [ "$i" -le "$LAST" ]; do
  if [ "$LIMIT" -gt 0 ] && [ "$ACTED" -ge "$LIMIT" ]; then
    echo "Reached LIMIT=$LIMIT, stopping."
    break
  fi

  game=$(cast call "$FACTORY" "gameAtIndex(uint256)(uint32,uint64,address)" "$i" \
    --rpc-url "$L1_RPC_URL" 2>/dev/null | tail -1)
  status=$(call "$game" "status()(uint8)")
  printf "game %-4s %s status=%s" "$i" "$game" "$status"

  # Pass 1: resolve. A game is settleable once the would-be counter's clock has run out;
  # getChallengerDuration saturates at maxClockDuration, so equality means expired.
  if [ "$status" = "0" ] && [ "$SKIP_RESOLVE" != "true" ]; then
    mcd=$(call "$game" "maxClockDuration()(uint64)")
    dur=$(call "$game" "getChallengerDuration(uint256)(uint64)" 0)
    if [ "$dur" -lt "$mcd" ]; then
      echo "  -> clock not expired ($(( (mcd - dur) / 60 ))min left), skip"
      i=$((i + 1)); continue
    fi
    echo "  -> resolving"
    if send "$game" "resolveClaim(uint256,uint256)" 0 0; then
      if send "$game" "resolve()"; then
        echo "        resolved"
        RESOLVED=$((RESOLVED + 1)); ACTED=$((ACTED + 1))
        status=$(call "$game" "status()(uint8)")
      else
        echo "        resolve() FAILED"; i=$((i + 1)); continue
      fi
    else
      echo "        resolveClaim() FAILED"; i=$((i + 1)); continue
    fi
  fi

  # Pass 2: close, which calls setAnchorState internally (try/catch) and sets the bond mode.
  if [ "$status" != "0" ] && [ "$SKIP_CLOSE" != "true" ]; then
    mode=$(call "$game" "bondDistributionMode()(uint8)")
    if [ "$mode" != "0" ]; then
      echo "        already closed (bondDistributionMode=$mode)"
    elif [ "$(cast call "$REGISTRY" "isGameFinalized(address)(bool)" "$game" --rpc-url "$L1_RPC_URL" 2>/dev/null)" != "true" ]; then
      echo "        resolved but airgap not elapsed, close later"
    else
      echo "        closing"
      if send "$game" "closeGame()"; then
        echo "        closed"
        CLOSED=$((CLOSED + 1)); ACTED=$((ACTED + 1))
      else
        echo "        closeGame() FAILED"
      fi
    fi
  elif [ "$status" != "0" ]; then
    echo ""
  fi

  i=$((i + 1))
done

echo
echo "Resolved : $RESOLVED"
echo "Closed   : $CLOSED"
echo -n "Anchor   : "; cast call "$REGISTRY" "anchorGame()(address)" --rpc-url "$L1_RPC_URL"
echo -n "Root     : "; cast call "$REGISTRY" "getAnchorRoot()(bytes32,uint256)" --rpc-url "$L1_RPC_URL" | tr '\n' ' '; echo
