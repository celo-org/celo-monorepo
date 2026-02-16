#!/usr/bin/env bash
# Warns the user if a libraries file already exists and will be overwritten.
#
# Usage: warn_if_libraries_exist <libraries_path>

warn_if_libraries_exist() {
  local LIBRARIES="$1"

  if [ -f "$LIBRARIES" ]; then
    echo "Warning: Libraries file '$LIBRARIES' already exists and will be overwritten." >&2
    read -r -p "Are you sure you want to continue? [y/N] " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
      echo "Aborted." >&2
      exit 1
    fi
  fi
}
