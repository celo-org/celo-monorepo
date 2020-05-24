#!/bin/bash

# ---- Configure logrotate ----
echo "Configuring logrotate" | logger
cat <<'EOF' > '/etc/logrotate.d/rsyslog'
/var/log/syslog
{
        rotate 7
        daily
        missingok
        notifempty
        delaycompress
        compress
        postrotate
                invoke-rc.d rsyslog rotate > /dev/null
        endscript
}

/var/log/mail.info
/var/log/mail.warn
/var/log/mail.err
/var/log/mail.log
/var/log/daemon.log
{
        rotate 7
        daily
        missingok
        notifempty
        delaycompress
        compress
        postrotate
                invoke-rc.d rsyslog rotate > /dev/null
        endscript
}

/var/log/kern.log
/var/log/auth.log
/var/log/user.log
/var/log/lpr.log
/var/log/cron.log
/var/log/debug
/var/log/messages
{
        rotate 4
        weekly
        missingok
        notifempty
        compress
        delaycompress
        sharedscripts
        postrotate
                invoke-rc.d rsyslog rotate > /dev/null
        endscript
}
EOF

# ---- Config /etc/screenrc ----
echo "Configuring /etc/screenrc" | logger
cat <<'EOF' > '/etc/screenrc'
bindkey -k k1 select 1  #  F1 = screen 1
bindkey -k k2 select 2  #  F2 = screen 2
bindkey -k k3 select 3  #  F3 = screen 3
bindkey -k k4 select 4  #  F4 = screen 4
bindkey -k k5 select 5  #  F5 = screen 5
bindkey -k k6 select 6  #  F6 = screen 6
bindkey -k k7 select 7  #  F7 = screen 7
bindkey -k k8 select 8  #  F8 = screen 8
bindkey -k k9 select 9  #  F9 = screen 9
bindkey -k F1 prev      # F11 = prev
bindkey -k F2 next      # F12 = next
EOF

# ---- Create backup script
echo "Creating chaindata backup script" | logger
cat <<'EOF' > /root/backup.sh
#!/bin/bash
set -x
systemctl stop geth.service
sleep 5
#note this will likely need to be upgraded to rsync, as the tar operation is slow on the persistent disk storage
tar -C /root/.celo/celo -zcvf /root/chaindata.tgz chaindata
gsutil cp /root/chaindata.tgz gs://${gcloud_project}-chaindata
sleep 3
systemctl start geth.service
EOF
chmod u+x /root/backup.sh

# ---- Create restore script
echo "Creating chaindata restore script" | logger
cat <<'EOF' > /root/restore.sh
#!/bin/bash
set -x
gsutil -q stat gs://${gcloud_project}-chaindata/chaindata.tgz
if [ $? -eq 0 ]
then
  #chaindata exists in bucket
  echo "downloading chaindata from gs://${gcloud_project}-chaindata/chaindata.tgz"
  gsutil cp gs://${gcloud_project}-chaindata/chaindata.tgz /root/chaindata.tgz
  mkdir -p /root/.celo/celo
  systemctl stop geth.service
  sleep 3
  tar zxvf /root/chaindata.tgz --directory /root/.celo/celo/
  rm -rf /root/chaindata.tgz
  sleep 3
  systemctl start geth.service
  else
    echo "No chaindata.tgz found in bucket gs://${gcloud_project}-chaindata, aborting restore"
  fi
EOF
chmod u+x /root/restore.sh

# ---- Useful aliases ----
echo "Configuring aliases" | logger
echo "alias ll='ls -laF'" >> /etc/skel/.bashrc
echo "alias ll='ls -laF'" >> /root/.profile
echo "alias gattach='docker exec -it geth geth attach'" >> /etc/skel/.bashrc

# ---- Install Stackdriver Agent
echo "Installing Stackdriver agent" | logger
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
bash add-monitoring-agent-repo.sh
apt update -y
apt install -y stackdriver-agent
systemctl restart stackdriver-agent

# ---- Install Fluent Log Collector
echo "Installing google fluent log collector agent" | logger
curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
bash add-logging-agent-repo.sh
apt update -y
apt install -y google-fluentd
apt install -y google-fluentd-catch-all-config-structured
systemctl restart google-fluentd

# ---- Setup swap
echo "Setting up swapfile" | logger
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
swapon -s

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

echo "Installing Docker..." | logger
apt update -y && apt upgrade -y
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2 htop
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update -y && apt upgrade -y
apt install -y docker-ce
systemctl start docker

echo "Configuring Docker..." | logger
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

echo "Configuring Geth" | logger

GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}

echo "Pulling geth..."
docker pull $GETH_NODE_DOCKER_IMAGE

IN_MEMORY_DISCOVERY_TABLE_FLAG=""
[[ ${in_memory_discovery_table} == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"

# Load configuration to files
mkdir -p $DATA_DIR/account
echo -n '${genesis_content_base64}' | base64 -d > $DATA_DIR/genesis.json
echo -n '${bootnodes_base64}' | base64 -d > $DATA_DIR/bootnodes
echo -n '${rid}' > $DATA_DIR/replica_id
echo -n '${ip_address}' > $DATA_DIR/ipAddress
echo -n '${attestation_signer_geth_account_secret}' > $DATA_DIR/account/accountSecret
echo -n '${attestation_signer_private_key}' > $DATA_DIR/pkey

echo "Starting geth..." | logger
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
#--light.serve ${max_peers} \\
#--light.maxpeers ${max_peers} \\
Restart=always
ExecStart=/usr/bin/docker run \\
  --rm \\
  --name geth \\
  --net=host \\
  -v $DATA_DIR:$DATA_DIR \\
  --entrypoint /bin/sh \\
  $GETH_NODE_DOCKER_IMAGE -c "\\
    geth \\
      --etherbase ${attestation_signer_address} \\
      --unlock ${attestation_signer_address} \\
      --password $DATA_DIR/account/accountSecret \\
      --allow-insecure-unlock \\
      --nousb \\
      --bootnodes $(cat $DATA_DIR/bootnodes) \\
      --maxpeers ${max_peers} \\
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
      --networkid=${network_id} \\
      --syncmode=full \\
      --consoleformat=json \\
      --consoleoutput=stdout \\
      --verbosity=${geth_verbosity} \\
      --nat=extip:${ip_address} \\
      --metrics \\
      $IN_MEMORY_DISCOVERY_TABLE_FLAG \\
  "
ExecStop=/usr/bin/docker stop -t 60 %N

[Install]
WantedBy=default.target
EOF

echo "Starting Geth" | logger
systemctl daemon-reload
systemctl enable geth.service
#systemctl restart geth.service

# ---- Set Up and Run Geth Exporter ----
echo "Configuring Geth Exporter" | logger
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
  --rm \\
  --name geth-exporter \\
  -v $DATA_DIR:$DATA_DIR \\
  --net=host \\
  $GETH_EXPORTER_DOCKER_IMAGE \\
  /usr/local/bin/geth_exporter \\
    -ipc $DATA_DIR/geth.ipc \\
    -filter "(.*overall|percentiles_95)"
ExecStop=/usr/bin/docker stop -t 30 %N

[Install]
WantedBy=default.target
EOF

echo "Starting Geth Exporter" | logger
systemctl daemon-reload
systemctl enable geth-exporter.service
systemctl restart geth-exporter.service

echo "Adding DC to docker group" | logger
usermod -aG docker dc

#--- run restore script
echo "Restoring chaindata from backup" | logger
bash /root/restore.sh