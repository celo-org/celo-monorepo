#!/usr/bin/env bash
set -euo pipefail

# Uploads contract build artifacts to GCS
#
# Flags:
# -b: Name of the bucket to upload artifacts to
# -n: Name of the network to upload artifacts for

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

TARBALL=$NETWORK.tar.gz

tar -zcvf $TARBALL build/$NETWORK && \
  gsutil cp $TARBALL gs://$ARTIFACT_BUCKET/$NETWORK && \
  rm $TARBALL
