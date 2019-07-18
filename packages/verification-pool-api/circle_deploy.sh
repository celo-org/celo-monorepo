#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

if [ $CHANGED = true ] ; then
  echo "Changes detected in verification pool - deploying to integration"

  # TODO(sklanje): Add lines to update contracts once master is up to
  #     date with rewards distribution changes
  yarn run firebase use celo-testnet
  yarn set-env integration
  yarn run build integration
  yarn run firebase deploy --only database,hosting,functions:handleVerificationRequestintegration --token $FIREBASE_TOKEN

else
  echo "No changes in verification pool - skipping deploy to integration"
fi
