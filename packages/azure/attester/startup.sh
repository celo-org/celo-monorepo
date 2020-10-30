#!/bin/bash

set -x
set -e

. ./provider-init.sh
. /etc/default/celo

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

cp celo-attestations-run /usr/local/bin
cp celo-attestations.service /etc/systemd/system/celo-attestations.service
systemctl daemon-reload
systemctl enable celo-attestations.service
systemctl restart celo-attestations.service
