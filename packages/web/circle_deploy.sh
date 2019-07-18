#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

if [ $CHANGED = true ] ; then
  echo "Changes detected in web - deploying to dev.celo.org"

  echo $GCLOUD_SERVICE_KEY > ${HOME}/gcloud-service-key.json
  gcloud auth activate-service-account --key-file <(echo $GCLOUD_SERVICE_KEY_PROTOCOL_INTEGRATION)
  gcloud --quiet config set project celo-testnet
  yarn run deploy:dev
else
  echo "No changes in web - skipping deploy"
  exit 0;
fi