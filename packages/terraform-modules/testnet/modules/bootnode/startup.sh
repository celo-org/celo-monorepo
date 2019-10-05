#! /bin/sh

echo "Installing Docker..."

# TODO(trevor): investigate how to pull this into a separate file so
# other startup scripts can use it
apt update && apt upgrade
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update
apt install -y docker-ce
systemctl start docker

echo "Configuring Docker..."
gcloud auth configure-docker

BOOTNODE_VERBOSITY=1

GETH_BOOTNODE_DOCKER_IMAGE=${geth_bootnode_docker_image_repository}:${geth_bootnode_docker_image_tag}


# download & apply secrets pulled from Cloud Storage as environment vars
echo "Downloading secrets from Google Cloud Storage..."
SECRETS_ENV_PATH=/var/.env.celo.secrets
gsutil cp gs://${gcloud_secrets_bucket}/${gcloud_secrets_base_path}/.env.bootnode $SECRETS_ENV_PATH
# Apply the .env file
. $SECRETS_ENV_PATH

echo "Pulling bootnode..."
docker pull $GETH_BOOTNODE_DOCKER_IMAGE

echo "Starting bootnode..."
docker run -p 30301:30301/udp --net=host -d $GETH_BOOTNODE_DOCKER_IMAGE /bin/sh -c "\
  set -euo pipefail && \
  mkdir /etc/bootnode && \
  echo $NODE_KEY > /etc/bootnode/node.key && \
  /usr/local/bin/bootnode \
    --nat=extip:${ip_address} \
    --nodekey=/etc/bootnode/node.key \
    --verbosity=$BOOTNODE_VERBOSITY"
