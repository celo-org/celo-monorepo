#!/bin/bash

echo $1
echo $2

NEWORK=baklava
VERSION=4
NEW_RELEASE=celo-core-contracts-v$VERSION
OLD_RELEASE=celo-core-contracts-v$VERSION-1

NEW_BRANCH=alexbharley/github-actions-deployment # $NEW_RELEASE.$VERSION
OLD_BRANCH=$NEW_RELEASE.$VERSION-1

echo "Verify deployed...";
yarn --cwd packages/protocol run verify-deployed -b $OLD_BRANCH.$NETWORK -n $NETWORK -f; 
echo "Verify deployed complete!";

echo "Check versions...";
yarn --cwd packages/protocol run verify-deployed -a $OLD_BRANCH -b $NEW_BRANCH -r report.json; 
echo "Check versions complete!";

INITIALIZATION_FILE=`ls -t releaseData/initializationData/* | head -n 1 | xargs realpath`
yarn --cwd packages/protocol run make-release -b $NEW_BRANCH -n $NETWORK -p proposal.json -r report.json -i packages/protocol/releaseData/initializationData/release$VERSION.json; 
