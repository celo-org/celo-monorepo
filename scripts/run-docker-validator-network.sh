#!/usr/bin/env bash
set -euo pipefail

export LC_ALL=en_US.UTF-8

# Usage: run-network.sh <COMMAND> <DATA_DIR>
COMMAND=${1:-"pull,accounts,deploy,run-validator,status"}
DATA_DIR=${2:-"/tmp/celo/network"}

export CELO_IMAGE=${3:-"us.gcr.io/celo-testnet/celo-node@sha256:6612c17f1a531ce2d7c0d9bcd29afecaf4dcf348684eb747d167130381337552"}
#export CELO_IMAGE=${3:-"us.gcr.io/celo-testnet/geth@sha256:4bc97381db0bb81b7a3e473bb61d447c90be165834316d3f75bc34d7db718b39"}
export NETWORK_ID=${4:-"1101"}
export NETWORK_NAME=${5:-"baklavastaging"}
export DEFAULT_PASSWORD=${6:-"1234"}
export CELO_IMAGE_ATTESTATION=${7:-"us.gcr.io/celo-testnet/celo-monorepo@sha256:708ea8b24736a755c4dd3792e8973a6f0bf92b1f91edceb8e0b603ad66f2d70c"}
export CELO_PROVIDER=${8:-"https://baklavastaging-forno.celo-testnet.org/"} # https://berlintestnet001-forno.celo-networks-dev.org/
export DATABASE_URL=${9:-"sqlite://db/attestation.db"}

export NEXMO_KEY="xx"
export NEXMO_SECRET="xx"
export NEXMO_BLACKLIST=""
HOSTNAME=$(hostname)
export ETHSTATS_ARG="$HOSTNAME@$NETWORK_NAME-ethstats.celo-testnet.org"

VALIDATOR_DIR="${DATA_DIR}/validator"
PROXY_DIR="${DATA_DIR}/proxy"
FULLNODE_DIR="${DATA_DIR}/fullnode"
ATTESTATION_DIR="${DATA_DIR}/attestation-service"


mkdir -p $DATA_DIR
mkdir -p $VALIDATOR_DIR
mkdir -p $PROXY_DIR
mkdir -p $FULLNODE_DIR
mkdir -p $ATTESTATION_DIR

__PWD=$PWD


#### Internal functions
remove_containers () {
    echo -e "\tRemoving previous celo containers"
    docker rm -f celo-proxy celo-validator celo-attestation-service || echo -e "Containers removed"
}

download_genesis () {
    echo -e "\tDownload genesis.json and static-nodes.json to the container"
    docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/static_nodes/o/$NETWORK_NAME?alt=media -O /root/.celo/static-nodes.json"
    docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/genesis_blocks/o/$NETWORK_NAME?alt=media -O /root/.celo/genesis.json"
    
    docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/genesis_blocks/o/$NETWORK_NAME?alt=media -O /root/.celo/genesis.json"

}

make_status_requests () {
    echo -e "Checking Proxy and Validator state:"
    
    echo -n "* Proxy eth_blockNumber:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" localhost:8555
    echo -n "* Validator eth_blockNumber:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" localhost:8545


    echo -n "* Proxy net_peerCount:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":74}' -H "Content-Type: application/json" localhost:8555
    echo -n "* Validator net_peerCount:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":74}' -H "Content-Type: application/json" localhost:8545
    
    echo -n "* Proxy eth_mining:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":1}' -H "Content-Type: application/json" localhost:8555
    echo -n "* Validator eth_mining:"
    curl -X POST --data '{"jsonrpc":"2.0","method":"eth_mining","params":[],"id":1}' -H "Content-Type: application/json" localhost:8545

    echo -e ""
    
}

#### Main 

if [[ $COMMAND == *"help"* ]]; then
    
    echo -e "Script for running a local validator network using docker containers. This script runs:"
    echo -e "\t - A Validator node"
    echo -e "\t - A Proxy node"
    echo -e "\t - An attestation service\n"

    echo -e "Options:"
    echo -e "$0 <COMMAND> <DATA_DIR> <CELO_IMAGE> <NETWORK_ID> <NETWORK_NAME> <PASSWORD>"
    echo -e "\t - Command; comma separated list of actions to execute. Options are: help, pull, clean, accounts, deploy, run-validator, run-attestation, run-fullnode, status. Default: pull,accounts,deploy,run-validator,status"
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

    echo -e "* Downloading docker image: $CELO_IMAGE"
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
    echo -e "\tCELO_VALIDATOR_GROUP_ADDRESS=$CELO_VALIDATOR_GROUP_ADDRESS"
    echo -e "\tCELO_PROXY_ADDRESS=$CELO_PROXY_ADDRESS"
    
    export CELO_VALIDATOR_BLS_PUBLIC_KEY=$(docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD $DEFAULT_PASSWORD | geth account proof-of-possession $CELO_VALIDATOR_ADDRESS $CELO_VALIDATOR_ADDRESS "| tail -1| cut -d' ' -f 5| tr -cd "[:alnum:]\n" )
    export CELO_VALIDATOR_BLS_SIGNATURE=$(docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c " printf '%s\n' $DEFAULT_PASSWORD $DEFAULT_PASSWORD | geth account proof-of-possession $CELO_VALIDATOR_ADDRESS $CELO_VALIDATOR_ADDRESS "|tail -2|head -1| cut -d' ' -f 4| tr -cd "[:alnum:]\n" )
    
    echo -e "\tCELO_VALIDATOR_BLS_PUBLIC_KEY=$CELO_VALIDATOR_BLS_PUBLIC_KEY"
    echo -e "\tCELO_VALIDATOR_BLS_SIGNATURE=$CELO_VALIDATOR_BLS_SIGNATURE"

fi

if [[ $COMMAND == *"deploy"* ]]; then

    echo -e "* Deploying ..."
    cd $DATA_DIR
    
    download_genesis
    echo -e "\tInitializing using genesis"
    docker run -v $PWD/proxy:/root/.celo $CELO_IMAGE init /root/.celo/genesis.json
    docker run -v $PWD/validator:/root/.celo $CELO_IMAGE init /root/.celo/genesis.json

fi


if [[ $COMMAND == *"run-validator"* ]]; then

    echo -e "* Let's run the validator network ..."
    cd $DATA_DIR

    remove_containers
    echo -e "\tStarting the Proxy"
    screen -S celo-proxy -d -m docker run --name celo-proxy --restart always -p 8555:8545 -p 8556:8546 -p 30313:30303 -p 30313:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal,istanbul --maxpeers 1100 --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503 --ethstats=wss://proxy-$ETHSTATS_ARG
    
    sleep 10s
    
    export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
    export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
    echo -e "\tProxy running: enode://$PROXY_ENODE@$PROXY_IP"
    
    echo -e "\tStarting Validator node"
    docker run -v $PWD/validator:/root/.celo --entrypoint sh --rm $CELO_IMAGE -c "echo $DEFAULT_PASSWORD > /root/.celo/.password"

    screen -S celo-validator -d -m docker run --name celo-validator --restart always -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal,istanbul --maxpeers 125 --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30303  --unlock=$CELO_VALIDATOR_ADDRESS --password /root/.celo/.password --ethstats=wss://validator-$ETHSTATS_ARG
    
    sleep 5s
     
    echo -e "\tEverything should be running, you can check running 'screen -ls'"
    screen -ls
        
    echo -e "\tYou can re-attach to the proxy or the validator running:"
    echo -e "\t 'screen -r -S celo-proxy' or 'screen -r -S celo-validator'\n"
    
fi

if [[ $COMMAND == *"run-attestation"* ]]; then

    echo -e "* Let's run the attestation service ..."
    
    echo -e "\tPulling docker image: $CELO_IMAGE_ATTESTATION"
    docker pull $CELO_IMAGE_ATTESTATION
    
    export ATTESTATION_KEY=0x$(celocli account:new| tail -3| head -1| cut -d' ' -f 2| tr -cd "[:alnum:]\n")
    echo -e "\tATTESTATION_KEY=$ATTESTATION_KEY"
    
    screen -S attestation-service -d -m  docker run -v $PWD/attestation-service:/celo-monorepo/packages/attestation-service/db --name celo-attestation-service -d --restart always --entrypoint /bin/bash -e ATTESTATION_KEY=$ATTESTATION_KEY -e ACCOUNT_ADDRESS=0x$CELO_VALIDATOR_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=nexmo -e NEXMO_KEY=$NEXMO_KEY -e NEXMO_SECRET=$NEXMO_SECRET -e NEXMO_BLACKLIST=$NEXMO_BLACKLIST  -p 3000:80 -v $PWD/attestation-service:/root/.celo $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && touch db/attestation.db && yarn run db:migrate && yarn start "
    
    echo -e "\tAttestation service should be running, you can check running 'screen -ls'"
    echo -e "\tYou can re-attach to the attestation-service running:"
    echo -e "\t 'screen -r -S celo-attestation-service'\n"

fi

if [[ $COMMAND == *"status"* ]]; then

    make_status_requests

fi

if [[ $COMMAND == *"run-fullnode"* ]]; then

    echo -e "* Let's run the full node ..."
    cd $DATA_DIR

     docker rm -f celo-fullnode || echo -e "Container removed"

    export CELO_ACCOUNT_ADDRESS=$(celocli account:new |tail -1| cut -d' ' -f 2| tr -cd "[:alnum:]\n")

    docker run -v $PWD/fullnode:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/static_nodes/o/$NETWORK_NAME?alt=media -O /root/.celo/static-nodes.json"

    docker run -v $PWD/fullnode:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "wget https://www.googleapis.com/storage/v1/b/genesis_blocks/o/$NETWORK_NAME?alt=media -O /root/.celo/genesis.json"
    docker run -v $PWD/fullnode:/root/.celo $CELO_IMAGE init /root/.celo/genesis.json

    echo -e "\tStarting the Full Node"

    screen -S celo-fullnode -d -m docker run --name celo-fullnode --restart always -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD/fullnode:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --lightserv 90 --lightpeers 1000 --maxpeers 1100 --etherbase $CELO_ACCOUNT_ADDRESS --ethstats=fullnode-$ETHSTATS_ARG
    
    sleep 2s

    echo -e "\tEverything should be running, you can check running 'screen -ls'"
    screen -ls

    echo -e "\tYou can re-attach to the full node running:"
    echo -e "\t 'screen -r -S celo-fullnode'\n"
fi

cd $__PWD





