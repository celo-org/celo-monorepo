#! /bin/sh

echo "Installing Docker..."
apt update && apt upgrade
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update
apt install -y docker-ce
systemctl start docker

echo "Configuring Docker..."
gcloud auth configure-docker

CELOTOOL_DOCKER_IMAGE=${celotool_docker_image_repository}:${celotool_docker_image_tag}
GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}


docker pull $CELOTOOL_DOCKER_IMAGE

echo "Pulled celotool docker image"
# start the celotool Docker container so we can use it for multiple commands
CELOTOOL_CONTAINER_ID=`docker run -td $CELOTOOL_DOCKER_IMAGE /bin/sh`

echo "Created celotool container" $CELOTOOL_CONTAINER_ID

celotooljs () {
  # NOTE(trevor): I ran into issues when using $@ directly in `docker exec`
  CELOTOOL_ARGS=$@
  docker exec $CELOTOOL_CONTAINER_ID /bin/sh -c "celotooljs.sh $CELOTOOL_ARGS"
}

# Set up account

echo "Generating private key for rid=${rid}"
PRIVATE_KEY=`celotooljs generate bip32 --mnemonic \"${mnemonic}\" --accountType validator --index ${rid}`

echo "Generating address"
ACCOUNT_ADDRESS=`celotooljs generate account-address --private-key $PRIVATE_KEY`
echo "Address: $ACCOUNT_ADDRESS"

echo "Generating Bootnode enode address for the validator:"
BOOTNODE_ENODE_ADDRESS=`celotooljs generate public-key --mnemonic \"${mnemonic}\" --accountType load_testing --index 0`
echo "Bootnode enode address: $BOOTNODE_ENODE_ADDRESS"

BOOTNODE_ENODE=$BOOTNODE_ENODE_ADDRESS@${bootnode_ip_address}:30301
echo "Bootnode enode: $BOOTNODE_ENODE"

# stop and remove the celotool Docker container as we no longer need it
echo "Stopping celotool container"
docker stop $CELOTOOL_CONTAINER_ID
echo "Removing celotool container"
docker rm $CELOTOOL_CONTAINER_ID

docker pull $GETH_NODE_DOCKER_IMAGE

echo "Starting geth...."

# We need to override the entrypoint in the geth image (which is originally `geth`)
docker run --net=host --entrypoint /bin/sh -d $GETH_NODE_DOCKER_IMAGE -c "\
  set -euo pipefail && \
  mkdir -p /root/.celo/account /var/geth && \
  echo -n ${genesis_content_base64} | base64 -d > /var/geth/genesis.json && \
  echo -n ${rid} > /root/.celo/replica_id && \
  echo -n ${ip_address} > /root/.celo/ipAddress && \
  echo -n $PRIVATE_KEY > /root/.celo/pkey && \
  echo -n $ACCOUNT_ADDRESS > /root/.celo/address && \
  echo -n $BOOTNODE_ENODE_ADDRESS > /root/.celo/bootnodeEnodeAddress && \
  echo -n $BOOTNODE_ENODE > /root/.celo/bootnodeEnode && \
  echo -n ${geth_account_secret} > /root/.celo/account/accountSecret && \
  geth init /var/geth/genesis.json && \
  geth account import --password /root/.celo/account/accountSecret /root/.celo/pkey && \
  geth \
    --bootnodes=enode://$BOOTNODE_ENODE \
    --password=/root/.celo/account/accountSecret \
    --unlock=$ACCOUNT_ADDRESS \
    --mine \
    --rpc \
    --rpcaddr 0.0.0.0 \
    --rpcapi=eth,net,web3,debug \
    --rpccorsdomain='*' \
    --rpcvhosts=* \
    --ws \
    --wsaddr 0.0.0.0 \
    --wsorigins=* \
    --wsapi=eth,net,web3,debug \
    --nodekey=/root/.celo/pkey \
    --etherbase=$ACCOUNT_ADDRESS \
    --networkid=${network_id} \
    --syncmode=full \
    --miner.verificationpool=${verification_pool_url} \
    --consoleformat=json \
    --consoleoutput=stdout \
    --verbosity=${geth_verbosity} \
    --istanbul.blockperiod=${block_time} \
    --maxpeers=${max_peers} \
    --nat=extip:${ip_address}"
