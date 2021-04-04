#!/usr/bin/env bash

NETWORK="mainnet"

for i in 1 2 3
do
    yarn check-versions \
        -a "celo-core-contracts-v$(($i - 1)).$NETWORK" \
        -b "celo-core-contracts-v$i.$NETWORK" \
        -r "releaseData/versionReports/release$i-report.json" \
        -i # ignore InitializableV2 up to v3 due to backwards incompatibility
done
