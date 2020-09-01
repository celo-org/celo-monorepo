#! /bin/bash

CELO_IMAGE=$(cat /home/ubuntu/celo_image)
NETWORK_ID=$(cat /home/ubuntu/network_id)
SYNC_MODE=$(cat /home/ubuntu/sync_mode)

cd /home/ubuntu/celo-data-directory
BOOTNODE_ENODES="$(sudo docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
sudo docker run --name celo-fullnode -d --restart unless-stopped -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode $SYNC_MODE --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --light.serve 1 --light.maxpeers 1 --maxpeers 10 --bootnodes $BOOTNODE_ENODES --nousb
