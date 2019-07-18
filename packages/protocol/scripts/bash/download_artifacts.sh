#!/usr/bin/env bash
set -euo pipefail

# Downloads contract build artifacts from GCS
#
# Flags:
# -b: Name of the bucket to download artifacts from
# -n: Name of the network to download artifacts for

ARTIFACT_BUCKET="contract_artifacts"
NETWORK=""
while getopts 'b:n:' flag; do
  case "${flag}" in
    b) ARTIFACT_BUCKET="${OPTARG:-contract_artifacts}" ;;
    n) NETWORK="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

TARBALL=.$NETWORK-$RANDOM.tar.gz

# For some reason, unable to extract sometimes
curl https://www.googleapis.com/storage/v1/b/$ARTIFACT_BUCKET/o/$NETWORK?alt=media > $TARBALL \
  && tar -zxvf $TARBALL \
  && rm $TARBALL
