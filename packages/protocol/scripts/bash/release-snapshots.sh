#!/usr/bin/env bash

N=`echo -n $RELEASE_TAG | tail -c -1`

for i in `eval echo {1..$N}`
do
    yarn check-versions \
        -a "core-contracts.v$(($i - 1))" \
        -b "core-contracts.v$i" \
        -r "releaseData/versionReports/release$i-report.json"
done
