#!/usr/bin/env bash
set -euo pipefail

# Deploys the blockchain api to App Engine
#
# Flags:
# -n: Name of the network, maps to App Engine 'service' (integration, production, etc.)

NETWORK=""

while getopts 'a:n:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

echo "Starting blockchain api deployment."

echo 'Deploying to gcloud'
gcloud --project celo-testnet app deploy -q "app.${NETWORK}.yaml"

echo 'Hitting service url to trigger update'
# This seems to be necessary to ensure get App Engine starts the service
curl "https://${NETWORK}-dot-celo-testnet.appspot.com" > /dev/null 2>&1

echo "Done deployment."
