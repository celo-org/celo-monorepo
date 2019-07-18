#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

if [ $CHANGED = true ] ; then
	export GIT_BRANCH=$(git symbolic-ref -q --short HEAD)
	echo $GIT_BRANCH

	if [ $GIT_BRANCH == "master" ]; then
		export BRANCH_CONFIG_MAPPING="app.int.yaml"
	else
		export BRANCH_CONFIG_MAPPING=""
	fi

	echo $BRANCH_CONFIG_MAPPING

	if [ -z $BRANCH_CONFIG_MAPPING ]; then
		echo "Branch does not have deployment setting"
		exit 0
	else
		gcloud auth activate-service-account --key-file <(echo $GCLOUD_SERVICE_KEY_PROTOCOL_INTEGRATION)
		gcloud --quiet config set project celo-testnet
		yarn deploy -q $BRANCH_CONFIG_MAPPING
	fi
else
  echo "No changes in blockchain-api - skipping deploy"
  exit 0
fi
