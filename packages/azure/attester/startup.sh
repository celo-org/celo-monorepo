#!/bin/bash

set -x
set -e

. ./provider-init.sh
. /etc/default/celo

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

echo "Pulling geth..."
docker pull $GETH_NODE_DOCKER_IMAGE

# Load configuration to files
curl -o $DATA_DIR/genesis.json https://www.googleapis.com/storage/v1/b/genesis_blocks/o/${CELO_ENV}?alt=media

echo "Starting geth..."
docker run \
  --rm \
  --net=host \
  -v $DATA_DIR:$DATA_DIR \
  --entrypoint /bin/sh \
  -i $GETH_NODE_DOCKER_IMAGE \
  -c "geth init $DATA_DIR/genesis.json"

cp celo-node-run /usr/local/bin
cp celo-node.service /etc/systemd/system/celo-node.service
systemctl daemon-reload
systemctl enable celo-node.service
systemctl restart celo-node.service

echo "Pulling attestation service..."
docker pull $ATTESTATION_SERVICE_DOCKER_IMAGE

cp attestation-service-run /usr/local/bin
cp attestation-service.service /etc/systemd/system/attestation-service.service
systemctl daemon-reload
systemctl enable attestation-service.service
systemctl restart attestation-service.service
