NETWORK="baklava"

for i in 1 2 3
do
	yarn check-versions \
        -a "celo-core-contracts-v$(($i - 1)).$NETWORK" \
        -b "celo-core-contracts-v$i.$NETWORK" \
        -r "releaseData/versionReports/release$i-report.json"
done
