#!/bin/bash

set -x
set -e

. ./provider-init.sh
. /etc/default/celo

echo "Validator address: $VALIDATOR_ACCOUNT_ADDRESS"
echo "Proxy URL: $PROXY_URL"

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

cp celo-validator-run /usr/local/bin
cp celo-validator.service /etc/systemd/system/celo-validator.service
systemctl daemon-reload
systemctl enable celo-validator.service
systemctl restart celo-validator.service

echo "Pulling geth exporter..."
docker pull $GETH_EXPORTER_DOCKER_IMAGE

cp exporter-run /usr/local/bin
cp geth-exporter.service /etc/systemd/system/geth-exporter.service
systemctl daemon-reload
systemctl enable geth-exporter.service
systemctl restart geth-exporter.service
