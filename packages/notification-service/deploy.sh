#!/usr/bin/env bash
set -euo pipefail

# Deploys the notification serivice to App Engine
#
# Flags:
# -n: Name of the network, maps to App Engine 'service' (alfajores, mainnet, etc.)

NETWORK=""

while getopts 'a:n:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

PROJECT="celo-mobile-${NETWORK}"

echo "Starting notification service deployment."

echo 'Copying over config file'
cp "config/config.${NETWORK}.env" .env

echo 'Deploying to gcloud'
gcloud --project ${PROJECT} app deploy -q "app.${NETWORK}.yaml"

echo 'Hitting service url to trigger update'
# This seems to be necessary to ensure get App Engine starts the service
curl "https://notification-dot-${PROJECT}.appspot.com" > /dev/null 2>&1

echo "Done deployment."
