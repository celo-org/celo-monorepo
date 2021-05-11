#!/bin/bash


# ---- Configure logrotate ----
echo "Configuring logrotate" | logger
cat <<'EOF' > '/etc/logrotate.d/rsyslog'
/var/log/syslog
/var/log/mail.info
/var/log/mail.warn
/var/log/mail.err
/var/log/mail.log
/var/log/daemon.log
/var/log/kern.log
/var/log/auth.log
/var/log/user.log
/var/log/lpr.log
/var/log/cron.log
/var/log/debug
/var/log/messages
{
        rotate 3
        daily
        missingok
        notifempty
        delaycompress
        compress
        sharedscripts
        postrotate
                #invoke-rc.d rsyslog rotate > /dev/null   # does not work on debian10
                kill -HUP `pidof rsyslogd`
        endscript
}
EOF

# ---- Tune rsyslog to avoid redundantly logging docker output
echo "Updating rsyslog.conf to avoid redundantly logging docker output"
cat <<'EOF' > /etc/rsyslog.conf
# /etc/rsyslog.conf configuration file for rsyslog
#
# For more information install rsyslog-doc and see
# /usr/share/doc/rsyslog-doc/html/configuration/index.html

#################
#### MODULES ####
#################

module(load="imuxsock") # provides support for local system logging
module(load="imklog")   # provides kernel logging support

###########################
#### GLOBAL DIRECTIVES ####
###########################

#
# Use traditional timestamp format.
# To enable high precision timestamps, comment out the following line.
#
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat

#
# Set the default permissions for all log files.
#
$FileOwner root
$FileGroup adm
$FileCreateMode 0640
$DirCreateMode 0755
$Umask 0022

#
# Where to place spool and state files
#
$WorkDirectory /var/spool/rsyslog

#
# Include all config files in /etc/rsyslog.d/
#
$IncludeConfig /etc/rsyslog.d/*.conf


###############
#### RULES ####
###############

#
# First some standard log files.  Log by facility.
#
auth,authpriv.*                 /var/log/auth.log
*.*;auth,authpriv.none          -/var/log/syslog
kern.*                          -/var/log/kern.log


#
# Some "catch-all" log files.
#
*.=debug;\
        auth,authpriv.none;\
        news.none;mail.none     -/var/log/debug
*.=info;*.=notice;*.=warn;\
        auth,authpriv.none;\
        cron,daemon.none;\
        mail,news.none          -/var/log/messages

#
# Emergencies are sent to everybody logged in.
#
*.emerg                         :omusrmsg:*
EOF

# ---- Restart rsyslogd
echo "Restarting rsyslogd"
systemctl restart rsyslog

# ---- Create restore script
echo "Creating chaindata restore script" | logger
cat <<'EOF' > /root/restore.sh
#!/bin/bash
set -x

# test to see if chaindata exists in bucket
gsutil -q stat gs://${gcloud_project}-chaindata/chaindata.tgz
if [ $? -eq 0 ]
then
  #chaindata exists in bucket
  mkdir -p /root/.celo/celo
  mkdir -p /root/.celo/celo/restore
  echo "downloading chaindata from gs://${gcloud_project}-chaindata/chaindata.tgz" | logger
  gsutil cp gs://${gcloud_project}-chaindata/chaindata.tgz /root/.celo/celo/restore/chaindata.tgz
  echo "stopping geth to untar chaindata" | logger
  systemctl stop geth.service
  sleep 3
  echo "Deleting old chaindata" | logger
  rm -rf /root/.celo/celo/chaindata/*
  echo "untarring chaindata" | logger
  tar zxvf /root/.celo/celo/restore/chaindata.tgz --directory /root/.celo/celo
  echo "removing chaindata tarball" | logger
  rm -rf /root/.celo/celo/restore/chaindata.tgz
  sleep 3
  echo "starting geth" | logger
  systemctl start geth.service
  else
    echo "No chaindata.tgz found in bucket gs://${gcloud_project}-chaindata, aborting warp restore" | logger
  fi
EOF
chmod u+x /root/restore.sh

# ---- Create rsync restore script
echo "Creating rsync chaindata restore script" | logger
cat <<'EOF' > /root/restore_rsync.sh
#!/bin/bash
set -x

# test to see if chaindata exists in the rsync chaindata bucket
gsutil -q stat gs://${gcloud_project}-chaindata-rsync/CURRENT
if [ $? -eq 0 ]
then
  #chaindata exists in bucket
  echo "stopping geth" | logger
  systemctl stop geth.service
  echo "downloading chaindata via rsync from gs://${gcloud_project}-chaindata-rsync" | logger
  mkdir -p /root/.celo/celo/chaindata
  gsutil -m rsync -d -r gs://${gcloud_project}-chaindata-rsync /root/.celo/celo/chaindata
  echo "restarting geth" | logger
  sleep 3
  systemctl start geth.service
  else
    echo "No chaindata found in bucket gs://${gcloud_project}-chaindata-rsync, aborting warp restore" | logger
  fi
EOF
chmod u+x /root/restore_rsync.sh

# ---- Useful aliases ----
echo "Configuring aliases" | logger
echo "alias ll='ls -laF'" >> /etc/skel/.bashrc
echo "alias ll='ls -laF'" >> /root/.bashrc
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

# ---- Setup swap
echo "Setting up swapfile" | logger
fallocate -l 4G /root/.celo/swapfile
chmod 600 /root/.celo/swapfile
mkswap /root/.celo/swapfile
swapon /root/.celo/swapfile
swapon -s

# Remove existing chain data
[[ ${reset_geth_data} == "true" ]] && rm -rf $DATA_DIR/geth
mkdir -p $DATA_DIR/account

# ---- Install Docker ----

echo "Installing Docker..." | logger
apt update -y && apt upgrade -y
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2 htop screen
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update -y && apt upgrade -y
apt install -y docker-ce
apt upgrade -y
systemctl start docker

# ---- Config /etc/screenrc ----
echo "Configuring /etc/screenrc" | logger
cat <<'EOF' >> '/etc/screenrc'
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

echo "Configuring Docker..." | logger
cat <<'EOF' > '/etc/docker/daemon.json'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3",
    "mode": "non-blocking" 
  }
}
EOF

echo "Restarting docker" | logger
systemctl restart docker

# ---- Set Up and Run Geth ----

echo "Configuring Geth" | logger

DATA_DIR=/root/.celo

GETH_NODE_DOCKER_IMAGE=${geth_node_docker_image_repository}:${geth_node_docker_image_tag}

echo "Pulling geth..." | logger
docker pull $GETH_NODE_DOCKER_IMAGE

IN_MEMORY_DISCOVERY_TABLE_FLAG=""
[[ ${in_memory_discovery_table} == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"

# Load configuration to files
mkdir -p $DATA_DIR/account

echo -n '${rid}' > $DATA_DIR/replica_id
echo -n '${ip_address}' > $DATA_DIR/ipAddress
echo -n '${proxy_private_key}' > $DATA_DIR/pkey
echo -h '${proxy_geth_account_secret}' > $DATA_DIR/account/accountSecret

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
  -c "geth account import --password $DATA_DIR/account/accountSecret $DATA_DIR/pkey | true"

cat <<EOF >/etc/systemd/system/geth.service
[Unit]
Description=Docker Container %N
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run \\
  --rm \\
  --name geth \\
  --net=host \\
  -v $DATA_DIR:$DATA_DIR \\
  --entrypoint /bin/sh \\
  $GETH_NODE_DOCKER_IMAGE -c "\\
    geth \\
      --etherbase ${proxy_address} \\
      --unlock ${proxy_address} \\
      --password $DATA_DIR/account/accountSecret \\
      --allow-insecure-unlock \\
      --nousb \\
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
      --celostats=${proxy_name}@${ethstats_host} \\
      --istanbul.blockperiod=${block_time} \\
      --istanbul.requesttimeout=${istanbul_request_timeout_ms} \\
      --maxpeers=${max_peers} \\
      --nat=extip:${ip_address} \\
      --metrics \\
      --pprof \\
      $IN_MEMORY_DISCOVERY_TABLE_FLAG \\
      --proxy.proxy \\
      --proxy.proxiedvalidatoraddress ${validator_account_address} \\
      --proxy.internalendpoint :30503 \\
      --light.serve 0 \\
  "
ExecStop=/usr/bin/docker stop -t 60 %N

[Install]
WantedBy=default.target
EOF

echo "Starting Geth" | logger
systemctl daemon-reload
systemctl enable geth.service

echo "Adding DC to docker group" | logger
usermod -aG docker dc

# --- run restore script
# this script tries to restore chaindata from a GCS hosted tarball.
# if the chaindata doesn't exist on GCS, geth will start normal (slow) p2p sync
echo "Restoring chaindata from backup tarball" | logger
bash /root/restore.sh

# todo: add some logic to look at the chaindata tarball bucket versus the rsync bucket and pick the best one.
# for now we try both, with rsync taking precedence b/c it runs last.

# --- run rsync restore script
# this script tries to restore chaindata from a GCS hosted bucket via rsync.
# if the chaindata doesn't exist on GCS, geth will start normal (slow) p2p sync, perhaps boosted by what the tarball provided
echo "Restoring chaindata from backup via rsync" | logger
bash /root/restore_rsync.sh

#--- remove compilers
echo "Removing compilers" | logger
sudo apt remove -y build-essential gcc make linux-compiler-gcc-8-x86 cpp
sudo apt -y autoremove