#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

if [ $CHANGED = true ] ; then
  export GIT_BRANCH=$(git symbolic-ref -q --short HEAD)
  echo "Using Git Branch $GIT_BRANCH"

  if [ $GIT_BRANCH == "master" ]; then
    echo "Preparing to deploy to Int"
    export DEPLOY_TASK="deploy:integration"
  elif [ $GIT_BRANCH == "staging" ]; then
    echo "Preparing to deploy to Staging Argentina"
    export DEPLOY_TASK="deploy:staging-argentina"
  elif [ $GIT_BRANCH == "production" ]; then
    echo "Preparing to deploy to Prod"
    export DEPLOY_TASK="deploy:production"
  else
    echo "Branch does not have deployment setting"
    exit 0
  fi

  echo "Authenticating with gcloud"
  echo $GCLOUD_SERVICE_KEY_NOTIFICATION_SERVICE > ${HOME}/serviceAccountKey.json
  gcloud auth activate-service-account --key-file=${HOME}/serviceAccountKey.json --account=circle-ci-deployer@celo-org-mobile.iam.gserviceaccount.com
  gcloud config set account circle-ci-deployer@celo-org-mobile.iam.gserviceaccount.com
  rm ${HOME}/serviceAccountKey.json
  echo "Deploying now..."
  yarn $DEPLOY_TASK
  echo "Deployment finished."
else
  echo "No changes in notification-service - skipping deploy"
  exit 0
fi
