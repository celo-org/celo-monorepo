#!/bin/bash

# ---- Set Up Persistent Disk ----

# gives a path similar to `/dev/sdb`
DISK_PATH=$(readlink -f /dev/disk/by-id/google-${attached_disk_name})
DATA_DIR=/root/.celo

echo "Setting up persistent disk ${attached_disk_name} at $DISK_PATH..."

DISK_FORMAT=ext4
CURRENT_DISK_FORMAT=$(lsblk -i -n -o fstype $DISK_PATH)

echo "Checking if disk $DISK_PATH format $CURRENT_DISK_FORMAT matches desired $DISK_FORMAT..."

# If the disk has already been formatted previously (this will happen
# if this instance has been recreated with the same disk), we skip formatting
if [[ $CURRENT_DISK_FORMAT == $DISK_FORMAT ]]; then
  echo "Disk $DISK_PATH is correctly formatted as $DISK_FORMAT"
else
  echo "Disk $DISK_PATH is not formatted correctly, formatting as $DISK_FORMAT..."
  mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard $DISK_PATH
fi

# Mounting the volume
echo "Mounting $DISK_PATH onto $DATA_DIR"
mkdir -p $DATA_DIR
DISK_UUID=$(blkid $DISK_PATH | cut -d '"' -f2)
echo "UUID=$DISK_UUID     $DATA_DIR   auto    discard,defaults    0    0" >> /etc/fstab
mount $DATA_DIR

# Remove existing chain data
[[ ${reset_geth_data} == "true" ]] && rm -rf $DATA_DIR/geth
mkdir -p $DATA_DIR/account

# ---- Install Docker ----

echo "Installing Docker..."
apt update -y && apt upgrade -y
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update -y && apt upgrade -y
apt install -y docker-ce
systemctl start docker

echo "Configuring Docker..."
cat <<'EOF' > '/etc/docker/daemon.json'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3" 
  }
}
EOF
systemctl restart docker

# ---- Set Up and Run Geth ----

GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}

ACCOUNT_ADDRESS=${validator_account_address}
echo "Address: $ACCOUNT_ADDRESS"

echo "Proxy enode address: ${proxy_enode}"
echo "Proxy internal ip address: ${proxy_internal_ip}"
echo "Proxy external ip address: ${proxy_external_ip}"
PROXY_INTERNAL_ENODE="enode://${proxy_enode}@${proxy_internal_ip}:30503"
PROXY_EXTERNAL_ENODE="enode://${proxy_enode}@${proxy_external_ip}:30303"

PROXY_URL="$PROXY_INTERNAL_ENODE;$PROXY_EXTERNAL_ENODE"
echo "Proxy URL: $PROXY_URL"

echo "Pulling geth..."
docker pull $GETH_NODE_DOCKER_IMAGE

IN_MEMORY_DISCOVERY_TABLE_FLAG=""
[[ ${in_memory_discovery_table} == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"

# Load configuration to files
echo -n '${genesis_content_base64}' | base64 -d > $DATA_DIR/genesis.json
echo -n '${rid}' > $DATA_DIR/replica_id
echo -n '${ip_address}' > $DATA_DIR/ipAddress
echo -n '${validator_private_key}' > $DATA_DIR/pkey
echo -n '${validator_account_address}' > $DATA_DIR/address
echo -n '${proxy_enode}' > $DATA_DIR/proxyEnodeAddress
echo -n '$PROXY_URL' > $DATA_DIR/proxyURL
echo -n '${validator_geth_account_secret}' > $DATA_DIR/account/accountSecret
echo -n $PROXY_INTERNAL_ENODE > /root/.celo/proxyInternalEnode
echo -n $PROXY_EXTERNAL_ENODE > /root/.celo/proxyExternalEnode

echo "Starting geth..."
# We need to override the entrypoint in the geth image (which is originally `geth`).
# `geth account import` fails when the account has already been imported. In
# this case, we do not want to pipefail
docker run \
  --rm \
  --net=host \
  -v $DATA_DIR:$DATA_DIR \
  --entrypoint /bin/sh \
  -i $GETH_NODE_DOCKER_IMAGE \
  -c "geth init $DATA_DIR/genesis.json && geth account import --password $DATA_DIR/account/accountSecret $DATA_DIR/pkey | true"

cat <<EOF >/etc/systemd/system/geth.service
[Unit]
Description=Docker Container %N
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run \\
  --name geth \\
  --restart=always \\
  --net=host \\
  -v $DATA_DIR:$DATA_DIR \\
  --entrypoint /bin/sh \\
  $GETH_NODE_DOCKER_IMAGE -c "\\
    geth \\
      --password=$DATA_DIR/account/accountSecret \\
      --unlock=$ACCOUNT_ADDRESS \\
      --mine \\
      --rpc \\
      --rpcaddr 0.0.0.0 \\
      --rpcapi=eth,net,web3 \\
      --rpccorsdomain='*' \\
      --rpcvhosts=* \\
      --ws \\
      --wsaddr 0.0.0.0 \\
      --wsorigins=* \\
      --wsapi=eth,net,web3 \\
      --nodekey=$DATA_DIR/pkey \\
      --etherbase=$ACCOUNT_ADDRESS \\
      --networkid=${network_id} \\
      --syncmode=full \\
      --consoleformat=json \\
      --consoleoutput=stdout \\
      --verbosity=${geth_verbosity} \\
      --ethstats=${validator_name}@${ethstats_host} \\
      --istanbul.blockperiod=${block_time} \\
      --istanbul.requesttimeout=${istanbul_request_timeout_ms} \\
      --maxpeers=${max_peers} \\
      --nat=extip:${ip_address} \\
      --metrics \\
      $IN_MEMORY_DISCOVERY_TABLE_FLAG \\
      --nodiscover \\
      --proxy.proxied \\
      --proxy.proxyenodeurlpair=\\"$PROXY_URL\\" \\
  "
ExecStop=/usr/bin/docker rm -f %N

[Install]
WantedBy=default.target
EOF

systemctl daemon-reload
systemctl enable geth.service
systemctl restart geth.service

# ---- Set Up and Run Geth Exporter ----

GETH_EXPORTER_DOCKER_IMAGE=${geth_exporter_docker_image_repository}:${geth_exporter_docker_image_tag}

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

cat <<EOF >/etc/systemd/system/geth-exporter.service
[Unit]
Description=Docker Container %N
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run \\
  --name geth-exporter \\
  --restart=always \\
  -v $DATA_DIR:$DATA_DIR \\
  --net=host \\
  $GETH_EXPORTER_DOCKER_IMAGE \\
  /usr/local/bin/geth_exporter \\
    -ipc $DATA_DIR/geth.ipc \\
    -filter "(.*overall|percentiles_95)"
ExecStop=/usr/bin/docker rm -f %N

[Install]
WantedBy=default.target
EOF

systemctl daemon-reload
systemctl enable geth-exporter.service
systemctl restart geth-exporter.service
