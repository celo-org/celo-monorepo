#!/bin/bash
env=second
sed -i bak "s/GETH_NODE_DOCKER_IMAGE_TAG=\"[a-zA-Z0-9]*\"/GETH_NODE_DOCKER_IMAGE_TAG=\"$1\"/" ../../.env.$env
git commit ../../.env.$env -m "Bump geth to $1"

 yarn cli deploy destroy testnet -e $env
# sleep 400

yarn cli deploy initial testnet -e $env
