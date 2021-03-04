NETWORK="baklava"

for i in 1 2 3
do
	yarn check-versions \
        -a "celo-core-contracts-v$(($i - 1)).$NETWORK" \
        -b "celo-core-contracts-v$i.$NETWORK" \
        -r "release$i-report.json"
    yarn make-release -d -n "$NETWORK" \
        -b "celo-core-contracts-v$i.$NETWORK" \
        -i "releaseData/initializationData/release$i.json" \
        -r "release$i-report.json" \
        -p "release$i-proposal.json"
done
