#! /bin/bash

GCLOUD_ZONE=`gcloud compute instances list --filter="name=('${validator_name}')" --format 'value(zone)'`

# If this validator is proxied, it won't have an access config. We need to
# create one for the initial 1 time setup so we can reach the external internet
if [[ ${proxied} == "true" ]]; then
  gcloud compute instances add-access-config ${validator_name} --zone=$GCLOUD_ZONE
fi

# ---- Set Up Logging ----

curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh
bash install-logging-agent.sh

echo "
@include config.d/*.conf
# Prometheus monitoring.
<source>
  @type prometheus
  port 24231
</source>
<source>
  @type prometheus_monitor
</source>

# Do not collect fluentd's own logs to avoid infinite loops.
<match fluent.**>
  @type null
</match>

# Add a unique insertId to each log entry that doesn't already have it.
# This helps guarantee the order and prevent log duplication.
<filter **>
@type add_insert_ids
</filter>

# Configure all sources to output to Google Cloud Logging
<match **>
  @type google_cloud
  buffer_type file
  buffer_path /var/log/google-fluentd/buffers
  # Set the chunk limit conservatively to avoid exceeding the recommended
  # chunk size of 5MB per write request.
  buffer_chunk_limit 512KB
  # Flush logs every 5 seconds, even if the buffer is not full.
  flush_interval 5s
  # Enforce some limit on the number of retries.
  disable_retry_limit false
  # After 3 retries, a given chunk will be discarded.
  retry_limit 3
  # Wait 10 seconds before the first retry. The wait interval will be doubled on
  # each following retry (20s, 40s...) until it hits the retry limit.
  retry_wait 10
  # Never wait longer than 5 minutes between retries. If the wait interval
  # reaches this limit, the exponentiation stops.
  # Given the default config, this limit should never be reached, but if
  # retry_limit and retry_wait are customized, this limit might take effect.
  max_retry_wait 300
  # Use multiple threads for processing.
  num_threads 8
  # Use the gRPC transport.
  use_grpc true
  # If a request is a mix of valid log entries and invalid ones, ingest the
  # valid ones and drop the invalid ones instead of dropping everything.
  partial_success true
  # Enable monitoring via Prometheus integration.
  enable_monitoring true
  monitoring_type opencensus
  detect_json true
</match>" > /etc/google-fluentd/google-fluentd.conf

echo "
<match docker_logs>
  @type rewrite_tag_filter
  <rule>
    key log
    pattern ^{
    tag docker_logs_json
  </rule>
  <rule>
    key log
    pattern ^[^{]
    tag docker_logs_plain
  </rule>
</match>

<filter docker_logs_json>
  @type parser
  key_name log
  reserve_data false
  <parse>
    @type json
  </parse>
</filter>

<filter docker_logs_plain>
  @type record_transformer
  <record>
    message $${record["log"]}
  </record>
</filter>
" > /etc/google-fluentd/config.d/docker.conf
systemctl restart google-fluentd

# ---- Set Up Monitoring Agent ----

curl -sSO https://dl.google.com/cloudagents/install-monitoring-agent.sh
bash install-monitoring-agent.sh

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
echo '{"log-driver":"fluentd","log-opts":{"fluentd-address":"0.0.0.0:24224","tag":"docker_logs"}}' > /etc/docker/daemon.json
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

PROXIED_FLAGS=""
PROXY_ENODE=""
if [[ ${proxied} == "true" ]]; then
  # $PROXY_ENODE_ADDRESS is from the secrets pulled from google cloud
  PROXY_INTERNAL_ENODE="enode://$PROXY_ENODE_ADDRESS@${proxy_internal_ip_address}:30503"
  PROXY_EXTERNAL_ENODE="enode://$PROXY_ENODE_ADDRESS@${proxy_external_ip_address}:30303"

  echo "Proxy internal enode: $PROXY_INTERNAL_ENODE"
  echo "Proxy external enode: $PROXY_EXTERNAL_ENODE"

  PROXIED_FLAGS="--proxy.proxied --nodiscover --proxy.proxyenodeurlpair=\"$PROXY_INTERNAL_ENODE;$PROXY_EXTERNAL_ENODE\""


  # if this validator is proxied, cut it off from the external internet after
  # we've downloaded everything
  echo "Deleting access config"
  # The command hangs but still succeeds, give it some time
  # This is likely because when the access config is actually deleted, this
  # instance cannot reach the external internet so the success ack from the server
  # is never received
  timeout 20 gcloud compute instances delete-access-config ${validator_name} --zone=$GCLOUD_ZONE
fi

IN_MEMORY_DISCOVERY_TABLE_FLAG=""
[[ ${in_memory_discovery_table} == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"

mkdir -p $DATA_DIR/account
echo -n "${genesis_content_base64}" | base64 -d > $DATA_DIR/genesis.json
echo -n "${rid}" > $DATA_DIR/replica_id
echo -n "$ACCOUNT_ADDRESS" > $DATA_DIR/address
echo -n "$BOOTNODE_ENODE_ADDRESS" > $DATA_DIR/bootnodeEnodeAddress
echo -n "$BOOTNODE_ENODE" > $DATA_DIR/bootnodeEnode
echo -n "$GETH_ACCOUNT_SECRET" > $DATA_DIR/account/accountSecret
if [ "${ip_address}" ]; then
  echo -n "${ip_address}" > $DATA_DIR/ipAddress
fi

echo "Starting geth..."
# We need to override the entrypoint in the geth image (which is originally `geth`).
# `geth account import` fails when the account has already been imported. In
# this case, we do not want to pipefail
docker run \
  -v $DATA_DIR:$DATA_DIR \
  --name geth \
  --net=host \
  --restart always \
  --entrypoint /bin/sh \
  -d \
  $GETH_NODE_DOCKER_IMAGE -c "\
  (
    set -euo pipefail ; \
    geth init $DATA_DIR/genesis.json \
  ) ; \
  TMP_PRIVATE_KEY_FILE=$(mktemp) ; \
  echo -n $PRIVATE_KEY > \$TMP_PRIVATE_KEY_FILE ; \
  geth account import --password $DATA_DIR/account/accountSecret \$TMP_PRIVATE_KEY_FILE ; \
  rm \$TMP_PRIVATE_KEY_FILE ; \
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
    --etherbase=$ACCOUNT_ADDRESS \
    --networkid=${network_id} \
    --syncmode=full \
    --consoleformat=json \
    --consoleoutput=stdout \
    --verbosity=${geth_verbosity} \
    --ethstats=${validator_name}@${ethstats_host} \
    --istanbul.blockperiod=${block_time} \
    --istanbul.requesttimeout=${istanbul_request_timeout_ms} \
    --maxpeers=${max_peers} \
    --metrics \
    --pprof \
    --allow-insecure-unlock \
    $IN_MEMORY_DISCOVERY_TABLE_FLAG \
    $PROXIED_FLAGS"

# ---- Set Up and Run Geth Exporter ----

GETH_EXPORTER_DOCKER_IMAGE=${geth_exporter_docker_image_repository}:${geth_exporter_docker_image_tag}

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

docker run -v $DATA_DIR:$DATA_DIR --name geth-exporter --restart=always --net=host -d $GETH_EXPORTER_DOCKER_IMAGE \
  /usr/local/bin/geth_exporter \
    -ipc $DATA_DIR/geth.ipc \
    -filter "(.*overall|percentiles_95)"
