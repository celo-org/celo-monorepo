#!/usr/bin/env bash
set -euo pipefail

mobile_root="$(dirname "$(dirname "$0")")"
echo $mobile_root
cd "$mobile_root"

branding=valora
# Please update the sha when branding updates are needed
branding_sha=6d643e3

if [[ "$branding" == "valora" ]]; then
  # prevents git from asking credentials
  export GIT_TERMINAL_PROMPT=0
  if [[ ! -e branding/valora ]] && ! git clone git@github.com:clabs-co/valora-app-branding.git branding/valora ; then
    echo "Couldn't clone private branding. Will use default branding."
    branding=celo
  else 
    pushd "branding/$branding"
    git checkout "$branding_sha"
    popd
  fi
fi

echo "Using branding/$branding"

rsync -avyz --exclude '.git' "$mobile_root/branding/$branding/" "$mobile_root"
