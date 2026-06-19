#!/usr/bin/env bash
# Run check_one.py over all windows at LOW concurrency (gentle on forno/Dune),
# collect JSON verdicts, summarize pass/fail. No LLM agents.
set -u
cd "$(dirname "$0")"
export DUNE_API_KEY="${DUNE_API_KEY:-NRQFdrQLcI0WKXJyC1NfBGpzBueNhUUz}"
OUT=/tmp/check_all_results.jsonl
: > "$OUT"

WINDOWS=(
  # 30 mixed-length
  2026-04-09:2026-06-03 2026-05-26:2026-06-15 2026-05-13:2026-06-09 2026-05-30:2026-06-15
  2026-05-11:2026-05-24 2026-06-13:2026-06-16 2026-04-19:2026-05-28 2026-05-16:2026-06-05
  2026-05-05:2026-05-24 2026-06-12:2026-06-17 2026-05-05:2026-06-18 2026-05-03:2026-05-19
  2026-05-22:2026-05-24 2026-04-21:2026-05-04 2026-04-25:2026-06-12 2026-04-22:2026-06-01
  2026-04-13:2026-05-01 2026-05-23:2026-06-11 2026-04-12:2026-05-13 2026-04-10:2026-06-12
  2026-05-30:2026-06-03 2026-05-18:2026-05-31 2026-06-02:2026-06-18 2026-04-11:2026-06-04
  2026-05-15:2026-05-21 2026-05-15:2026-05-22 2026-05-14:2026-06-13 2026-05-15:2026-06-10
  2026-05-10:2026-06-04 2026-06-07:2026-06-13
  # 8 short (1-2 day)
  2026-06-14:2026-06-15 2026-05-26:2026-05-27 2026-06-10:2026-06-11 2026-06-12:2026-06-13
  2026-04-17:2026-04-17 2026-05-26:2026-05-26 2026-05-23:2026-05-24 2026-05-20:2026-05-20
)

one() {
  local a="${1%%:*}" b="${1##*:}"
  for attempt in 1 2 3; do
    local r
    r=$(python3 check_one.py "$a" "$b" 2>/dev/null)
    if echo "$r" | python3 -c 'import json,sys; json.loads(sys.stdin.read())' 2>/dev/null; then
      echo "$r" >> "$OUT"; return
    fi
    sleep 5
  done
  echo "{\"window\":\"$a->$b\",\"pass\":false,\"fails\":[\"no-output-after-retries\"]}" >> "$OUT"
}
export -f one
export OUT

# Sequential (-P 1): avoids Dune's per-key rate limit (429). dune_request also
# retries 429 with backoff, so transient throttles are absorbed.
printf '%s\n' "${WINDOWS[@]}" | xargs -P 1 -I {} bash -c 'one "$@"' _ {}

echo "=== SUMMARY ==="
python3 - <<'EOF'
import json
rows=[json.loads(l) for l in open('/tmp/check_all_results.jsonl')]
p=[r for r in rows if r.get('pass')]
f=[r for r in rows if not r.get('pass')]
print(f"total={len(rows)} passed={len(p)} failed={len(f)}")
for r in f:
    print(f"  FAIL {r['window']}: {r.get('fails')}")
# show additivity diffs of passers
bad_add=[r for r in p if r.get('add_diff') not in (None,) and abs(r['add_diff'])>5]
print(f"passers with additivity diff>5: {len(bad_add)}")
EOF
