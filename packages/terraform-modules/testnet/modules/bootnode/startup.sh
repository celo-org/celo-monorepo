#! /bin/sh


# TODO separate this logic out
echo "Installing Docker"

apt update && apt upgrade
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update
apt install -y docker-ce
systemctl start docker

echo "Configuring docker..."
gcloud auth configure-docker


GETH_NODE_DOCKER_IMAGE_REPOSITORY="us.gcr.io/celo-testnet/geth"
# When upgrading change this to latest commit hash from the master of the geth repo
# `geth $ git show | head -n 1`
GETH_NODE_DOCKER_IMAGE_TAG="830e6e351b30c24e330f15830efffd30501b8d55"

GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY="gcr.io/celo-testnet/geth-all"
# When upgrading change this to latest commit hash from the master of the geth repo
# `geth $ git show | head -n 1`
GETH_BOOTNODE_DOCKER_IMAGE_TAG="830e6e351b30c24e330f15830efffd30501b8d55"

CELOTOOL_DOCKER_IMAGE_REPOSITORY="gcr.io/celo-testnet/celo-monorepo"
CELOTOOL_DOCKER_IMAGE_TAG="celotool-2616309a839a30e53faecfafb9b68ab51a5fcdcf"

BOOTNODE_VERBOSITY=6

# Get the node key from the celotool docker container

echo "Pulling celotool..."

docker pull $CELOTOOL_DOCKER_IMAGE_REPOSITORY:$CELOTOOL_DOCKER_IMAGE_TAG
NODE_KEY=`docker run --rm $CELOTOOL_DOCKER_IMAGE_REPOSITORY:$CELOTOOL_DOCKER_IMAGE_TAG \
  celotooljs.sh generate bip32 --mnemonic "${mnemonic}" \
  --accountType load_testing --index 0`

echo NODE_KEY: $NODE_KEY

echo "Pulling bootnode..."

docker pull $GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY:$GETH_BOOTNODE_DOCKER_IMAGE_TAG

# Start the bootnode
docker run -p 30301:30301/udp --net=host -d $GETH_BOOTNODE_DOCKER_IMAGE_REPOSITORY:$GETH_BOOTNODE_DOCKER_IMAGE_TAG \
  /bin/sh -c \
  "set -euo pipefail && \
  mkdir /etc/bootnode && \
  echo $NODE_KEY > /etc/bootnode/node.key && \
  /usr/local/bin/bootnode --nodekey=/etc/bootnode/node.key --verbosity=$BOOTNODE_VERBOSITY --nat=extip:${ip_address}"
