#!/usr/bin/env bash
set -euo pipefail

# Alternative to react-native launchPackager.command
# which doesn't work with monorepos (assumes app root is at the root of the monorepo)

# Set terminal title
echo -en "\\033]0;Metro\\a"
clear

mobile_root="$(dirname "$(dirname "$0")")"
cd "$mobile_root"

yarn react-native start

if [[ -z "${CI+xxx}" ]]; then
  echo "Process terminated. Press <enter> to close the window"
  read -r
fi


