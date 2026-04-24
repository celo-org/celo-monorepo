#!/usr/bin/env bash
# Warns if there's an extra transactions file for this release but none was passed.
# Usage: warn_extra_transactions <branch> <extra_txs_flag_value>

warn_extra_transactions() {
  local BRANCH="$1"
  local EXTRA_TXS="$2"

  if [ -n "$EXTRA_TXS" ]; then
    return
  fi

  source scripts/bash/extract-release-version.sh
  extract_release_version "$BRANCH"
  local MATCHING_FILES
  MATCHING_FILES=$(find releaseData/extraTransactions/ -name "*.json" 2>/dev/null | grep "release${RELEASE_VERSION}" || true)
  if [ -n "$MATCHING_FILES" ]; then
    echo -e "\033[31mWarning: Found extra transactions file(s) but no -e flag was provided:\033[0m" >&2
    echo "$MATCHING_FILES" | sed 's/^/\t/' >&2
    read -p "	Continue without extra transactions? (y/N) " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "	Aborting. Pass -e <file> to include extra transactions." >&2
      exit 1
    fi
  fi
}
