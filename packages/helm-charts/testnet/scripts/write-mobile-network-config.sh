#!/usr/bin/env bash
set -euo pipefail

# Basic Usage:
# ./write-mobile-network-config.sh NAME
# Specify -n NAMESPACE -r RELEASE -t TESTNET_NAME or just pass NAME to the script and that will set NAMESPACE, RELEASE and TESTNET_NAME to it


NAMESPACE=""
RELEASE=""
TESTNET_NAME=""
[ -n "$1" ] && NAMESPACE=$1 && RELEASE=$1 && TESTNET_NAME=$1
while getopts ':r:n:' flag; do
  case "${flag}" in
    n) NAMESPACE="${OPTARG}" ;;
    r) RELEASE="${OPTARG}" ;;
    t) TESTNET_NAME="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done
[ -z "$NAMESPACE" ] && echo "Need to set the NAMESPACE_NAME via the -n flag" && exit 1;
[ -z "$RELEASE" ] && echo "Need to set RELEASE_NAME via the -r flag" && exit 1;
[ -z "$TESTNET_NAME" ] && echo "Need to set TESTNET_NAME via the -t flag" && exit 1;

UNDERSCORE_TESTNET_NAME="${TESTNET_NAME/-/_}"

[ -z $(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx1 -o jsonpath='{.status.loadBalancer.ingress[0].ip}') ] && echo "Wait a minute, gethtx1 load balancer has not yet provisioned" && exit 1;

[ -z $(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx2 -o jsonpath='{.status.loadBalancer.ingress[0].ip}') ] && echo "Wait a minute, gethtx2 load balancer has not yet provisioned" && exit 1;

[ -z $(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx3 -o jsonpath='{.status.loadBalancer.ingress[0].ip}') ] && echo "Wait a minute, gethtx3 load balancer has not yet provisioned" && exit 1;

[ -z $(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx4 -o jsonpath='{.status.loadBalancer.ingress[0].ip}') ] && echo "Wait a minute, gethtx4 load balancer has not yet provisioned" && exit 1;

cat > ../mobile/src/geth/additionalNetworks.ts << EOF
export default {
  '$UNDERSCORE_TESTNET_NAME': {
    nodeDir: '.$UNDERSCORE_TESTNET_NAME',
    enodes: [
      'enode://$(kubectl get configmaps $NAMESPACE-geth-config -n $NAMESPACE -o jsonpath='{.data.gethtx1NodeId}')@$(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx1 -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):30303',
      'enode://$(kubectl get configmaps $NAMESPACE-geth-config -n $NAMESPACE -o jsonpath='{.data.gethtx2NodeId}'
      )@$(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx2 -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):30303',
      'enode://$(kubectl get configmaps $NAMESPACE-geth-config -n $NAMESPACE -o jsonpath='{.data.gethtx3NodeId}')@$(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx3 -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):30303',
      'enode://$(kubectl get configmaps $NAMESPACE-geth-config -n $NAMESPACE -o jsonpath='{.data.gethtx4NodeId}'
      )@$(kubectl get svc --namespace $NAMESPACE $RELEASE-gethtx4 -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):30303'
    ],
    networkID: 1101,
    genesis: $(kubectl get configmaps $NAMESPACE-geth-config -n $NAMESPACE -o jsonpath="{.data['genesis\.json']}")
  }
}
EOF
