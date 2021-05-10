#!/bin/bash

echo $1
echo $2

NETWORK=baklava
VERSION=4
NEW_RELEASE=celo-core-contracts-v$VERSION
OLD_RELEASE=celo-core-contracts-v$((VERSION-1))

NEW_BRANCH=alexbharley/github-actions-deployment # $NEW_RELEASE.$NETWORK
OLD_BRANCH=$OLD_RELEASE.$NETWORK

yarn;

echo "Verify deployed...";
yarn --cwd packages/protocol run verify-deployed -b $OLD_BRANCH -n $NETWORK -f; 
echo "Verify deployed complete!";

echo "Check versions...";
yarn --cwd packages/protocol run check-versions -a $OLD_BRANCH -b $NEW_BRANCH -r report.json; 
echo "Check versions complete!";

yarn --cwd packages/protocol run make-release -b $NEW_BRANCH -n $NETWORK -p proposal.json -r report.json -i packages/protocol/releaseData/initializationData/release$VERSION.json --r;
