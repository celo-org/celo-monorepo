#!/usr/bin/env bash
set -euo pipefail

mobile_root="$(dirname "$(dirname "$0")")"
echo $mobile_root
cd "$mobile_root"

branding=valora
branding_sha=6d643e3

export GIT_TERMINAL_PROMPT=0
if [[ ! -e branding/valora ]] && ! git clone git@github.com:clabs-co/valora-app-branding.git branding/valora ; then
  echo "Couldn't clone private branding. Will use default branding."
  branding=celo
else
  pushd "branding/$branding"
  git checkout "$branding_sha"
  popd
fi

echo "Using branding/$branding"

rsync -avyz --exclude '.git' "$mobile_root/branding/$branding/" "$mobile_root"
