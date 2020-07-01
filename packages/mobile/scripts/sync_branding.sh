#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Setup branding used in the project
# ========================================

# Flags:
# -b (Optional): Name of the branding to use: celo or valora (default)

branding=valora
while getopts 'b:' flag; do
  case "${flag}" in
    b) branding="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

mobile_root="$(dirname "$(dirname "$0")")"
echo $mobile_root
cd "$mobile_root"

# Please update the sha when valora branding updates are needed
valora_branding_sha=eefeea1

if [[ "$branding" == "valora" ]]; then
  # prevents git from asking credentials
  export GIT_TERMINAL_PROMPT=0
  if [[ ! -e branding/valora ]] && ! git clone git@github.com:clabs-co/valora-app-branding.git branding/valora ; then
    echo "Couldn't clone private branding. Will use default branding."
    branding=celo
  else 
    pushd "branding/$branding"
    git fetch
    git checkout "$valora_branding_sha"
    popd
  fi
fi

echo "Using branding/$branding"

rsync -avyz --exclude '.git' "$mobile_root/branding/$branding/" "$mobile_root"
