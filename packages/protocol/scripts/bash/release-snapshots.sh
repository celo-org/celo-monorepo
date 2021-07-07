#!/usr/bin/env bash

LATEST_TAG=`git tag -l "core-contracts.v*" --format "%(refname)" | tail -n 1`
LATEST_N=`echo -n $LATEST_TAG | tail -c -1`

for i in {1..$LATEST_N}
do
    yarn check-versions \
        -a "core-contracts.v$(($i - 1))" \
        -b "core-contracts.v$i" \
        -r "releaseData/versionReports/release$i-report.json"
done
