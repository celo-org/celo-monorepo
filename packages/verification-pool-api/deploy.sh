#!/usr/bin/env bash
set -euo pipefail

# Deploys the verification pool api to firebase functions
#
# Flags:
# -n: Name of the network, maps to App Engine 'service' (integration, production, etc.)

NETWORK=""

while getopts 'a:n:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    t) TOKEN="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$TOKEN" ] && echo "Need to set the TOKEN via the -t flag" && exit 1;

echo "Starting verification pool api deployment."

yarn
yarn run firebase use celo-testnet
yarn set-env $NETWORK
yarn run build
yarn firebase-bolt schema.bolt
yarn run firebase deploy --only "database,functions:handleVerificationRequest$NETWORK" --token $TOKEN

echo "Done deployment."
