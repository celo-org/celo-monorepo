test -f startup-env.sh && source startup-env.sh
cat <<EOF >/etc/default/celo
DATA_DIR=/root/.celo
CELO_ENV=${celoEnv}
BOOTNODES=${bootnodes}
VALIDATOR_KEY_VAULT=${validatorKeyVaultName}
PROXY_KEY_VAULT=${proxyKeyVaultName}
ATTESTER_KEY_VAULT=${attesterKeyVaultName}
GETH_NODE_DOCKER_IMAGE=${gethNodeDockerImageRepository}:${gethNodeDockerImageTag}
GETH_EXPORTER_DOCKER_IMAGE=${gethExporterDockerImageRepository}:${gethExporterDockerImageTag}
ATTESTATION_SERVICE_DOCKER_IMAGE=${attestationServiceDockerImageRepository}:${attestationServiceDockerImageTag}
NETWORK_ID=${networkId}
GETH_VERBOSITY=${gethVerbosity}
VALIDATOR_NAME=${validatorName}
PROXY_NAME=${proxyName}
ETHSTATS_HOST=${ethstatsHost}
BLOCK_TIME=${blockTime}
ISTANBUL_REQUEST_TIMEOUT_MS=${istanbulRequestTimeoutMs}
PROXY_MAX_PEERS=${proxyMaxPeers}
VALIDATOR_MAX_PEERS=${proxyMaxPeers}
PROXY_EXTERNAL_IP_ADDRESS=${proxyExternalIpAddress}
PROXY_INTERNAL_IP_ADDRESS=${proxyInternalIpAddress}
VALIDATOR_INTERNAL_IP_ADDRESS=${validatorInternalIpAddress}
ATTESTER_ACCOUNT_ADDRESS=${attesterAccountAddress}
VALIDATOR_ACCOUNT_ADDRESS=${validatorAccountAddress}
PROXY_URL="enode://${proxyPublicKey}@${proxyInternalIpAddress}:30503;enode://${proxyPublicKey}@${proxyExternalIpAddress}:30303"
SMS_PROVIDERS=twilio
ATTESTER_TWILIO_ACCOUNT_SID=${attesterTwilioAccountSID}
ATTESTER_TWILIO_MESSAGE_SERVICE_SID=${attesterTwilioMessageServiceSID}
ATTESTER_DB_USERNAME="${attesterPostgreSQLUsername}@${attesterDBName}"
ATTESTER_DB_HOSTNAME="${attesterDBName}.postgres.database.azure.com"
EOF
cat ./libcelo.sh >> /etc/default/celo

. /etc/default/celo

apt update -y && apt upgrade -y

apt install -y \
    curl \
    jq

DISK_LUN=lun0
DISK_PATH=`readlink -f /dev/disk/azure/scsi1/${DISK_LUN}`

echo "Setting up persistent disk at $DISK_PATH..."

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

echo "Mounting $DISK_PATH onto $DATA_DIR"
mkdir -p $DATA_DIR
DISK_UUID=`blkid $DISK_PATH | cut -d \" -f 2`
echo "UUID=${DISK_UUID}     $DATA_DIR   auto    discard,defaults    0    0" >> /etc/fstab
mount $DATA_DIR

echo "Installing Docker..."
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
