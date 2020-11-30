#! /bin/bash

CELO_IMAGE=$(cat /home/ubuntu/celo_image)
SYNC_MODE=$(cat /home/ubuntu/sync_mode)

cd /home/ubuntu/celo-data-directory
sudo docker run --name celo-fullnode -d --restart unless-stopped -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode $SYNC_MODE --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --light.serve 1 --light.maxpeers 1 --maxpeers 10 --nousb --datadir /root/.celo
