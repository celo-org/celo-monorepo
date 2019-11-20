#!/usr/bin/bash 
set -euo pipefail

export LC_ALL=en_US.UTF-8

# Usage: run-network.sh <COMMAND> <DATA_DIR>
COMMAND=${1:-"pull,accounts,deploy,run-validator"}
DATA_DIR=${2:-"/tmp/celo/network"}
export CELO_IMAGE=${3:-"us.gcr.io/celo-testnet/geth@sha256:4bc97381db0bb81b7a3e473bb61d447c90be165834316d3f75bc34d7db718b39"}
export NETWORK_ID=${4:-"1101"}
export NETWORK_NAME=${5:-"integration"}
export DEFAULT_PASSWORD=${6:-"1234"}


VALIDATOR_DIR="${DATA_DIR}/validator"
PROXY_DIR="${DATA_DIR}/proxy"
mkdir -p $DATA_DIR
mkdir -p $VALIDATOR_DIR
mkdir -p $PROXY_DIR
__PWD=$PWD


#### Internal functions
remove_containers () {
    echo -e "\tRemoving previous celo-proxy and celo-validator containers"
    #docker kill $(docker ps -a|grep celo-proxy|cut -d' ' -f 1) > /dev/null 2>&1
    docker rm -f $(docker ps -a|grep celo-proxy|cut -d' ' -f 1) > /dev/null 2>&1
    #docker kill $(docker ps -a|grep celo-validator|cut -d' ' -f 1) > /dev/null 2>&1 
    docker rm -f $(docker ps -a|grep celo-validator|cut -d' ' -f 1) > /dev/null 2>&1
}

download_genesis () {
    echo -e "\tDownload genesis.json and static-nodes.json to the container"
    docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/static_nodes/o/$NETWORK_NAME?alt=media -O /root/.celo/static-nodes.json"
    docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/genesis_blocks/o/$NETWORK_NAME?alt=media -O /root/.celo/genesis.json"
    
    docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/static_nodes/o/$NETWORK_NAME?alt=media -O /root/.celo/static-nodes.json"
    docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/genesis_blocks/o/$NETWORK_NAME?alt=media -O /root/.celo/genesis.json"
    
    #docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE /root/.celo/genesis.json /celo/
    #docker run -v $PWD/validator:/root/.celo --entrypoint cp $CELO_IMAGE /root/.celo/genesis.json /celo/

}

#### Main 

if [[ $COMMAND == *"help"* ]]; then
    
    echo -e "Script for running a local validator network using docker containers. This script runs:"
    echo -e "\t - A Validator node"
    echo -e "\t - A Proxy node"
    echo -e "\t - An attestation service\n"

    echo -e "Options:"
    echo -e "$0 <COMMAND> <DATA_DIR> <CELO_IMAGE> <NETWORK_ID> <NETWORK_NAME> <PASSWORD>"
    echo -e "\t - Command; comma separated list of actions to execute. Options are: help, pull, clean, accounts, deploy, run-validator, run-attestation. Default: pull,accounts,deploy,run"
    echo -e "\t - Data Dir; Local folder where will be created the data dir for the nodes. Default: /tmp/celo/network"
    echo -e "\t - Celo Image; Image to download"
    echo -e "\t - Celo Network; Docker image network to use (typically alfajores or baklava, but you can use a commit). "
    echo -e "\t - Network Id; 1101 for integration, 44785 for alfajores, etc."
    echo -e "\t - Network Name; integration by default"
    echo -e "\t - Password; Password to use during the creation of accounts"
    
    echo -e "\nExamples:"
    echo -e "$0 pull,clean,deploy,run-validator "
    echo -e "$0 deploy,run-validator /tmp/celo/network"

    echo -e "\n"
    exit 0
fi

if [[ $COMMAND == *"pull"* ]]; then

    echo -e "* Downloading docker image from $CELO_IMAGE"
    docker pull $CELO_IMAGE
fi


if [[ $COMMAND == *"clean"* ]]; then

    echo -e "* Removing data dir $DATA_DIR"
    rm -rf $DATA_DIR
    mkdir -p $DATA_DIR
    mkdir -p $VALIDATOR_DIR
    mkdir -p $PROXY_DIR
fi


if [[ $COMMAND == *"accounts"* ]]; then

    echo -e "* Creating addresses ..."
    cd $DATA_DIR
    
    export CELO_VALIDATOR_ADDRESS=$(docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD $DEFAULT_PASSWORD | geth account new " |tail -1| cut -d'{' -f 2| tr -cd "[:alnum:]\n" )
    export CELO_VALIDATOR_GROUP_ADDRESS=$(docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD $DEFAULT_PASSWORD | geth account new " |tail -1| cut -d'{' -f 2| tr -cd "[:alnum:]\n" )
    export CELO_PROXY_ADDRESS=$(docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD $DEFAULT_PASSWORD | geth account new " |tail -1| cut -d'{' -f 2| tr -cd "[:alnum:]\n" )

    echo -e "\tCELO_VALIDATOR_ADDRESS=$CELO_VALIDATOR_ADDRESS"
    echo -e "\tCELO_VALIDATOR_GROUP_ADDRESS=$CELO_VALIDATOR_ADDRESS"
    echo -e "\tCELO_PROXY_ADDRESS=$CELO_VALIDATOR_ADDRESS"

    export CELO_VALIDATOR_POP=$(docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD | geth account proof-of-possession $CELO_VALIDATOR_ADDRESS "| tail -1| cut -d' ' -f 3| tr -cd "[:alnum:]\n" )

    echo -e "\tCELO_VALIDATOR_POP=$CELO_VALIDATOR_POP"

fi

if [[ $COMMAND == *"deploy"* ]]; then

    echo -e "* Deploying ..."
    cd $DATA_DIR
    
    download_genesis
    echo -e "\tInitializing using genesis"
    docker run -v $PWD/proxy:/root/.celo $CELO_IMAGE init /root/.celo/genesis.json
    docker run -v $PWD/validator:/root/.celo $CELO_IMAGE init /root/.celo/genesis.json
    
    echo -e "\tSetting up nodekey"
    docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "printf '%s\n' $DEFAULT_PASSWORD | geth account set-node-key $CELO_PROXY_ADDRESS"
    docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "printf '%s\n' $DEFAULT_PASSWORD | geth account set-node-key $CELO_VALIDATOR_ADDRESS"
    
    #echo -e "\tPreparing for sync"
    #docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE /root/.celo/static-nodes.json /root/.celo/
    #docker run -v $PWD/validator:/root/.celo --entrypoint cp $CELO_IMAGE /root/.celo/static-nodes.json /root/.celo/
fi


if [[ $COMMAND == *"run-validator"* ]]; then

    echo -e "* Let's run the validator network ..."
    cd $DATA_DIR

    remove_containers
    echo -e "\tStarting the Proxy"
    screen -S celo-proxy -d -m docker run --name celo-proxy --restart always -p 8545:8545 -p 8546:8546 -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 1100 --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503
    
    export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
    export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
    echo -e "\tProxy running: enode://$PROXY_ENODE@$PROXY_IP"
    
    echo -e "\tStarting Validator node"
    screen -S celo-validator -d -m docker run --name celo-validator --restart always -p 127.0.0.1:8547:8545 -p 127.0.0.1:8548:8546 -p 30304:30303 -p 30304:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 125 --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30503
    
    echo -e "\tEverything should be running, you can check running `screen -ls`"
fi

if [[ $COMMAND == *"run-attestation"* ]]; then

    echo -e "* Let's run the attestation service ..."
    echo -e "Not implemented yet"
fi

cd $__PWD





