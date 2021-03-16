#!/usr/bin/env bash

NETWORK="baklava"

for i in 1 2 3
do
    # ignore LinkedList for v0 => v1 due to errant library versioning
    [ $i == 1 ] \
        && EXCLUDE=".*LinkedList.*|.*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|MetaTransactionWallet|SlasherUtil|UsingPrecompiles" \
        || EXCLUDE=""
	yarn check-versions \
        -a "celo-core-contracts-v$(($i - 1)).$NETWORK" \
        -b "celo-core-contracts-v$i.$NETWORK" \
        -r "releaseData/versionReports/release$i-report.json" \
        -e "$EXCLUDE"
done
