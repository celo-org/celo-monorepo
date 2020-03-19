# celostats

## Deploying on existing testnet

This helm chart is an evolution from the former `ethstats` chart.
This chart includes artifacts for deploying the artifacts of 
`celostats-server` (https://github.com/celo-org/celostats-server/) and
`celostats-frontend` (https://github.com/celo-org/celostats-frontend/).
Also, for compatibility reasons, include an ingress resource serving
at DNS `https://ethstats-${env}.${celo-domain}`, so the old-configured
clients can report/connect with that endpoint.

To upgrade from an exisiting `ethstats` package, the easiest way is:

1.  Remove the old `ethstats` package: `helm delete --purge ${env}-ethstats`

2.  Deploy the new package: `celotool deploy initial celostats -e ${env}`
