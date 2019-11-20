#!/bin/bash

# ---- Set Up Logging ----

curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh
bash install-logging-agent.sh

# ---- Install Docker ----

echo "Installing Docker..."
apt update && apt upgrade
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt update && apt upgrade
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

# ---- Set Up and Run Attestation Service ----

DATA_DIR=/root/.celo
mkdir -p $DATA_DIR
ATTESTATION_KEY=${attestation_key}
ACCOUNT_ADDRESS=${account_address}
CELO_PROVIDER=${celo_provider}
DATABASE_URL="postgres://${db_username}:${db_password}@${db_host}:5432/attestation_service"
SMS_PROVIDERS=${sms_providers}
NEXMO_KEY=${nexmo_key}
NEXMO_SECRET=${nexmo_secret}
NEXMO_BLACKLIST=${nexmo_blacklist}


ATTESTATION_SERVICE_DOCKER_IMAGE=${attestation_service_docker_image_repository}:${attestation_service_docker_image_tag}
docker pull $ATTESTATION_SERVICE_DOCKER_IMAGE

# Running the attestation service, migrating the DB when starting
docker run --name attestation-service \
 --net=host --entrypoint /bin/sh -d \
 -v $DATA_DIR:$DATA_DIR \
 -e DATABASE_URL=$DATABASE_URL \
 -e ATTESTATION_KEY=$ATTESTATION_KEY \
 -e ACCOUNT_ADDRESS=$ACCOUNT_ADDRESS \
 -e CELO_PROVIDER=$CELO_PROVIDER \
 -e SMS_PROVIDERS=$SMS_PROVIDERS \
 -e NEXMO_KEY=$NEXMO_KEY \
 -e NEXMO_SECRET=$NEXMO_SECRET \
 -e NEXMO_BLACKLIST=$NEXMO_BLACKLIST \
 $GETH_NODE_DOCKER_IMAGE -c "\
  (
    set -euo pipefail && \
    echo -n '$DATABASE_URL' > $DATA_DIR/databaseUrl && \
    echo -n '$ATTESTATION_KEY' > $DATA_DIR/attestationKey && \
    echo -n '$ACCOUNT_ADDRESS' > $DATA_DIR/accountAddress && \
    echo -n '$CELO_PROVIDER' > $DATA_DIR/celoProvider && \
    echo -n '$SMS_PROVIDERS' > $DATA_DIR/smsProviders && \
    echo -n '$NEXMO_KEY' > $DATA_DIR/nexmoKey && \
    echo -n '$NEXMO_SECRET' > $DATA_DIR/nexmoSecret && \
    echo -n '$NEXMO_BLACKLIST' > $DATA_DIR/nexmoBlacklist && \
  ) && ( \
    yarn run db:create:dev \
    yarn run db:migrate:dev \
    node lib/index.js \
  )"
