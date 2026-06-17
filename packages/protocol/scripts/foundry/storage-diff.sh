#!/usr/bin/env bash
# Storage-layout gate for the 0.5.x -> 0.8.x migration.
#
# Proxies on mainnet keep their storage; a migrated implementation MUST preserve
# the exact storage layout of the deployed 0.5.x version. This script compares a
# normalized storage layout of the freshly-built 0.8.x implementation against the
# committed 0.5.x baseline and exits non-zero on any drift.
#
# Usage:
#   scripts/foundry/storage-diff.sh <ContractName>
#   scripts/foundry/storage-diff.sh --baseline <ContractName>   # (re)capture 0.5 baseline
#   scripts/foundry/storage-diff.sh --all                       # diff every baselined contract
#
# Layouts are read straight from the forge artifacts (built with
# FOUNDRY_EXTRA_OUTPUT='["storageLayout"]'), so build the relevant profile first:
#   FOUNDRY_PROFILE=truffle-compat   FOUNDRY_EXTRA_OUTPUT='["storageLayout"]' forge build   # 0.5
#   FOUNDRY_PROFILE=truffle-compat8  FOUNDRY_EXTRA_OUTPUT='["storageLayout"]' forge build   # 0.8

set -euo pipefail

PROTOCOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROTOCOL_DIR"

OUT_05="out-truffle-compat"
OUT_08="out-truffle-compat-0.8"
BASELINE_DIR="releaseData/storageLayouts/0.5-baseline"

# Normalize a forge artifact's storageLayout: keep only the physically meaningful
# fields (slot, offset, variable label, and the human-readable type label +
# encoding + byte size). Compiler-internal astId numbers embedded in type ids are
# stripped so two builds of the same layout compare equal.
normalize() {
  local artifact="$1"
  jq -S '
    (.storageLayout // {storage: [], types: {}}) as $sl
    | [ $sl.storage[]? | {
        slot: .slot,
        offset: .offset,
        label: .label,
        type: ( $sl.types[.type].label ),
        encoding: ( $sl.types[.type].encoding ),
        numberOfBytes: ( $sl.types[.type].numberOfBytes )
      } ]
    | sort_by([(.slot|tonumber), .offset, .label])
  ' "$artifact"
}

artifact_path() {
  local out="$1" name="$2"
  # forge writes <out>/<File>.sol/<Name>.json; impl file usually matches name.
  local p="$out/$name.sol/$name.json"
  if [[ -f "$p" ]]; then echo "$p"; return 0; fi
  # fallback: search by basename
  find "$out" -path "*/$name.json" 2>/dev/null | head -1
}

capture_baseline() {
  local name="$1"
  local art; art="$(artifact_path "$OUT_05" "$name")"
  if [[ -z "${art:-}" || ! -f "$art" ]]; then
    echo "ERROR: no 0.5 artifact for $name in $OUT_05 (build truffle-compat first)" >&2
    return 2
  fi
  mkdir -p "$BASELINE_DIR"
  normalize "$art" > "$BASELINE_DIR/$name.json"
  local n; n="$(jq 'length' "$BASELINE_DIR/$name.json")"
  echo "baseline captured: $name ($n storage slots) -> $BASELINE_DIR/$name.json"
}

diff_one() {
  local name="$1"
  local base="$BASELINE_DIR/$name.json"
  if [[ ! -f "$base" ]]; then
    echo "ERROR: no baseline for $name (run --baseline $name on master/0.5 first)" >&2
    return 2
  fi
  local art; art="$(artifact_path "$OUT_08" "$name")"
  if [[ -z "${art:-}" || ! -f "$art" ]]; then
    echo "ERROR: no 0.8 artifact for $name in $OUT_08 (build truffle-compat8 first)" >&2
    return 2
  fi
  local newlayout; newlayout="$(mktemp)"
  normalize "$art" > "$newlayout"
  if diff -u "$base" "$newlayout" > /tmp/storage-diff-$name.txt 2>&1; then
    echo "OK  storage layout preserved: $name"
    rm -f "$newlayout"
    return 0
  else
    echo "FAIL storage layout DRIFT: $name"
    cat /tmp/storage-diff-$name.txt
    rm -f "$newlayout"
    return 1
  fi
}

case "${1:-}" in
  --baseline) shift; capture_baseline "$1" ;;
  --all)
    rc=0
    for b in "$BASELINE_DIR"/*.json; do
      [[ -e "$b" ]] || continue
      n="$(basename "$b" .json)"
      diff_one "$n" || rc=1
    done
    exit $rc
    ;;
  "" ) echo "usage: storage-diff.sh [--baseline] <Contract> | --all" >&2; exit 64 ;;
  * ) diff_one "$1" ;;
esac
