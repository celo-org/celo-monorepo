#!/usr/bin/env bash
set -euo pipefail

RELEASE=""
DELETE=false
[ -n "$1" ] && RELEASE=$1
while getopts ':r:d' flag; do
  case "${flag}" in
    r) RELEASE="${OPTARG}" ;;
    d) DELETE=true ;;
    *) echo "Unexpected option ${flag}" ;;
  esac
done
[ -z "$RELEASE" ] && echo "Need to set RELEASE_NAME via the -r flag" && exit 1;

if [[ ( "$RELEASE" = "integration") || ( "$RELEASE" = "staging" ) || ( "$RELEASE" = "production" ) ]]; then
  echo "You just tried to delete $RELEASE. You probably did not want to do that. Exiting the script. If this is a mistake, modify this script or do it manually"
  exit 1;
fi


echo "You are about to delete the network $RELEASE"
if $DELETE
then
  PVCS="$(kubectl get pvc --namespace=$RELEASE | grep $RELEASE | awk '{print $1}')"
fi

gcloud sql instances delete $RELEASE
helm del --purge $RELEASE
kubectl delete namespace $RELEASE

echo $PVCS
if $DELETE
then
  while read -r pvc; do
    kubectl delete pvc --namespace=$RELEASE "$pvc"
  done <<< "$PVCS"
  gcloud sql databases delete blockscout -i $RELEASE
fi
