#!/usr/bin/env bash
set -euo pipefail

# Basic Usage:
# ./port-forward.sh NAME
# Specify -n NAMESPACE -r RELEASE or just pass NAME to the script and that will set NAMESPACE and RELEASE to it

NAMESPACE=""
RELEASE=""
# Substitute _ for - because of the discrepancy between GCP and monorepo testnet names.
[ -n "$1" ] && NAMESPACE=${1/_/-} && RELEASE=${1/_/-}
while getopts ':r:n:' flag; do
  case "${flag}" in
    n) NAMESPACE="${OPTARG}" ;;
    r) RELEASE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done
[ -z "$NAMESPACE" ] && echo "Need to set the NAMESPACE_NAME via the -n flag" && exit 1;
[ -z "$RELEASE" ] && echo "Need to set RELEASE_NAME via the -r flag" && exit 1;

kubectl port-forward --namespace $NAMESPACE $(kubectl get pods --namespace $NAMESPACE -l "app in (ethereum,testnet), component=gethminer1, release=$RELEASE" --field-selector=status.phase=Running -o jsonpath="{.items[0].metadata.name}") 8545:8545 8546:8546
