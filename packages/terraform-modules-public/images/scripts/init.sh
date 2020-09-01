NODE_DIRECTORY=/home/ubuntu/celo-data-directory
mkdir -p $NODE_DIRECTORY
cd $NODE_DIRECTORY
docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json
