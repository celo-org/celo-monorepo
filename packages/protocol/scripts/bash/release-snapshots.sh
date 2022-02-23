#!/usr/bin/env bash

N=`ls releaseData/versionReports/ \
    | grep --only-matching "[[:digit:]]\+" \
    | sort -n \
    | tail -n 1`

for i in `seq $N`
do
    yarn check-versions \
        -a "core-contracts.v$(($i - 1))" \
        -b "core-contracts.v$i" \
        -r "releaseData/versionReports/release$i-report.json"
done
