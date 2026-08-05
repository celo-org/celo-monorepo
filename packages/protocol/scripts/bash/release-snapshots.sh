#!/usr/bin/env bash
set -euo pipefail

N=`echo -n $RELEASE_TAG | tail -c -1`

for i in `eval echo {1..$N}`
do
    # check-versions-foundry.sh names its report report-<old>-<new>.json; move it
    # to the snapshot location the versionReports diff gate expects.
    yarn release:check-versions:foundry \
        -a "core-contracts.v$(($i - 1))" \
        -b "core-contracts.v$i"
    mv "report-core-contracts.v$(($i - 1))-core-contracts.v$i.json" \
        "releaseData/versionReports/release$i-report.json"
done
