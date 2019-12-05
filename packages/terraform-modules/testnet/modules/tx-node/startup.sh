#! /bin/bash

# ---- Set Up Logging ----

curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh
bash install-logging-agent.sh

# ---- Install Docker ----

echo "Installing Docker..."
apt update && apt upgrade
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update && apt upgrade
apt install -y docker-ce
systemctl start docker

echo "Configuring Docker..."
gcloud auth configure-docker

# use GCP logging for Docker containers
echo '{"log-driver":"gcplogs"}' > /etc/docker/daemon.json
systemctl restart docker

# ---- Set Up and Run Geth ----

DATA_DIR=/root/.celo

GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}

# download & apply secrets pulled from Cloud Storage as environment vars
echo "Downloading secrets from Google Cloud Storage..."
SECRETS_ENV_PATH=/var/.env.celo.secrets
gsutil cp gs://${gcloud_secrets_bucket}/${gcloud_secrets_base_path}/.env.tx-node-${rid} $SECRETS_ENV_PATH
# Apply the .env file
. $SECRETS_ENV_PATH

echo "Address: $ACCOUNT_ADDRESS"
echo "Bootnode enode address: $BOOTNODE_ENODE_ADDRESS"

BOOTNODE_ENODE=$BOOTNODE_ENODE_ADDRESS@${bootnode_ip_address}:30301
echo "Bootnode enode: $BOOTNODE_ENODE"

echo "Pulling geth..."
docker pull $GETH_NODE_DOCKER_IMAGE

IN_MEMORY_DISCOVERY_TABLE_FLAG=""
[[ ${in_memory_discovery_table} == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"

echo "Starting geth..."
# We need to override the entrypoint in the geth image (which is originally `geth`)
docker run -v $DATA_DIR:$DATA_DIR -p 8545:8545/tcp -p 8546:8546/tcp --name geth --net=host --entrypoint /bin/sh -d $GETH_NODE_DOCKER_IMAGE -c "\
  set -euo pipefail && \
  mkdir -p $DATA_DIR/account /var/geth && \
  echo -n '${genesis_content_base64}' | base64 -d > /var/geth/genesis.json && \
  echo -n '${rid}' > $DATA_DIR/replica_id && \
  echo -n '${ip_address}' > $DATA_DIR/ipAddress && \
  echo -n '$PRIVATE_KEY' > $DATA_DIR/pkey && \
  echo -n '$ACCOUNT_ADDRESS' > $DATA_DIR/address && \
  echo -n '$BOOTNODE_ENODE_ADDRESS' > $DATA_DIR/bootnodeEnodeAddress && \
  echo -n '$BOOTNODE_ENODE' > $DATA_DIR/bootnodeEnode && \
  echo -n '$GETH_ACCOUNT_SECRET' > $DATA_DIR/account/accountSecret && \
  geth init /var/geth/genesis.json && \
  geth account import --password $DATA_DIR/account/accountSecret $DATA_DIR/pkey && \
  geth \
    --bootnodes=enode://$BOOTNODE_ENODE \
    --lightserv 90 \
    --lightpeers 1000 \
    --maxpeers 1100 \
    --rpc \
    --rpcaddr 0.0.0.0 \
    --rpcapi=eth,net,web3,debug \
    --rpccorsdomain='*' \
    --rpcvhosts=* \
    --ws \
    --wsaddr 0.0.0.0 \
    --wsorigins=* \
    --wsapi=eth,net,web3,debug \
    --nodekey=$DATA_DIR/pkey \
    --etherbase=$ACCOUNT_ADDRESS \
    --networkid=${network_id} \
    --syncmode=full \
    --consoleformat=json \
    --consoleoutput=stdout \
    --verbosity=${geth_verbosity} \
    --ethstats=${tx_node_name}:$ETHSTATS_WEBSOCKETSECRET@${ethstats_host} \
    --nat=extip:${ip_address} \
    --metrics \
    $IN_MEMORY_DISCOVERY_TABLE_FLAG"

# ---- Set Up and Run Geth Exporter ----

GETH_EXPORTER_DOCKER_IMAGE=${geth_exporter_docker_image_repository}:${geth_exporter_docker_image_tag}

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

docker run -v $DATA_DIR:$DATA_DIR --name geth-exporter --net=host -d $GETH_EXPORTER_DOCKER_IMAGE \
  /usr/local/bin/geth_exporter \
    -ipc $DATA_DIR/geth.ipc \
    -filter "(.*overall|percentiles_95)"
