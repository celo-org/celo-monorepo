#!/bin/bash -u
# Usage: test_sync.sh <network> <syncmode> <namespace>

network=$1
syncmode=$2
namespace=$3

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    aliassed=sed
elif [[ "$OSTYPE" == "darwin"* ]]; then
    aliased=gsed
fi
# Loads some envs
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [[ -f $DIR/../../../../.env.${network} ]]; then 
  source $DIR/../../../../.env.${network}
else
  source $DIR/../../../../.env
fi 

#kubectl port-forward -n $namespace ${network}-${namespace}-${syncmode}-node-0 8545 & >/dev/null 2>&1
target_block=$(curl -X POST -s --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://$env-forno.$CLUSTER_DOMAIN_NAME.org -H 'Content-Type: application/json')
target_block=$((target_block#FF))
current_block=$(kubectl -n $namespace exec -it ${network}-${namespace}-${syncmode}-node-0 -- geth attach --exec 'eth.blockNumber')

