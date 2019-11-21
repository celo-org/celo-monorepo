#! /bin/bash

# ---- Set Up Logging ----

curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh
bash install-logging-agent.sh

# ---- Set Up Persistent Disk ----

# gives a path similar to `/dev/sdb`
DISK_PATH=`readlink -f /dev/disk/by-id/google-${attached_disk_name}`
DATA_DIR=/root/.celo

echo "Setting up persistent disk ${attached_disk_name} at $DISK_PATH..."

DISK_FORMAT=ext4
CURRENT_DISK_FORMAT=`lsblk -i -n -o fstype $DISK_PATH`

echo "Checking if disk $DISK_PATH format $CURRENT_DISK_FORMAT matches desired $DISK_FORMAT..."

# If the disk has already been formatted previously (this will happen
# if this instance has been recreated with the same disk), we skip formatting
if [[ $CURRENT_DISK_FORMAT == $DISK_FORMAT ]]; then
  echo "Disk $DISK_PATH is correctly formatted as $DISK_FORMAT"
else
  echo "Disk $DISK_PATH is not formatted correctly, formatting as $DISK_FORMAT..."
  mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard $DISK_PATH
fi

mkdir -p $DATA_DIR
echo "Mounting $DISK_PATH onto $DATA_DIR"
mount -o discard,defaults $DISK_PATH $DATA_DIR

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

GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}

# download & apply secrets pulled from Cloud Storage as environment vars
echo "Downloading secrets from Google Cloud Storage..."
SECRETS_ENV_PATH=/var/.env.celo.secrets
gsutil cp gs://${gcloud_secrets_bucket}/${gcloud_secrets_base_path}/.env.validator-${rid} $SECRETS_ENV_PATH
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
# We need to override the entrypoint in the geth image (which is originally `geth`).
# `geth account import` fails when the account has already been imported. In
# this case, we do not want to pipefail
docker run -v $DATA_DIR:$DATA_DIR --name geth --net=host --entrypoint /bin/sh -d $GETH_NODE_DOCKER_IMAGE -c "\
  (
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
    geth init /var/geth/genesis.json
  ) && ( \
    geth account import --password $DATA_DIR/account/accountSecret $DATA_DIR/pkey ; \
    geth \
      --bootnodes=enode://$BOOTNODE_ENODE \
      --password=$DATA_DIR/account/accountSecret \
      --unlock=$ACCOUNT_ADDRESS \
      --mine \
      --rpc \
      --rpcaddr 0.0.0.0 \
      --rpcapi=eth,net,web3 \
      --rpccorsdomain='*' \
      --rpcvhosts=* \
      --ws \
      --wsaddr 0.0.0.0 \
      --wsorigins=* \
      --wsapi=eth,net,web3 \
      --nodekey=$DATA_DIR/pkey \
      --etherbase=$ACCOUNT_ADDRESS \
      --networkid=${network_id} \
      --syncmode=full \
      --consoleformat=json \
      --consoleoutput=stdout \
      --verbosity=${geth_verbosity} \
      --ethstats=${validator_name}:$ETHSTATS_WEBSOCKETSECRET@${ethstats_host} \
      --istanbul.blockperiod=${block_time} \
      --istanbul.requesttimeout=${istanbul_request_timeout_ms} \
      --maxpeers=${max_peers} \
      --nat=extip:${ip_address} \
      --metrics \
      $IN_MEMORY_DISCOVERY_TABLE_FLAG \
  )"

# ---- Set Up and Run Geth Exporter ----

GETH_EXPORTER_DOCKER_IMAGE=${geth_exporter_docker_image_repository}:${geth_exporter_docker_image_tag}

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

docker run -v $DATA_DIR:$DATA_DIR --name geth-exporter --net=host -d $GETH_EXPORTER_DOCKER_IMAGE \
  /usr/local/bin/geth_exporter \
    -ipc $DATA_DIR/geth.ipc \
    -filter "(.*overall|percentiles_95)"
