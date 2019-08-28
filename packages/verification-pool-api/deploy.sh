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
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

echo "Starting verification pool api deployment."

yarn
yarn set-env $NETWORK
yarn run build
yarn run firebase deploy --only "database,hosting,functions:handleVerificationRequest$NETWORK"

echo "Done deployment."
