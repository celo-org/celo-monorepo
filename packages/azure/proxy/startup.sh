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

cp celo-proxy-run /usr/local/bin
cp celo-proxy.service /etc/systemd/system/celo-proxy.service
systemctl daemon-reload
systemctl enable celo-proxy.service
systemctl restart celo-proxy.service

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

cp exporter-run /usr/local/bin
cp geth-exporter.service /etc/systemd/system/geth-exporter.service
systemctl daemon-reload
systemctl enable geth-exporter.service
systemctl restart geth-exporter.service
