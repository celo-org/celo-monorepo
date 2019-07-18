#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

NETWORK=integration

if [ $CHANGED = true ] ; then
  echo "Changes detected in protocol - deploying to integration"

  gcloud auth activate-service-account --key-file <(echo $GCLOUD_SERVICE_KEY_PROTOCOL_INTEGRATION)
  gcloud container clusters get-credentials integration --project celo-testnet --zone us-west1-a
  cd ../celotool
  yarn cli deploy upgrade contracts -e $NETWORK --verbose
else
  echo "No changes in protocol - skipping deploy"
fi
