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
ATTESTATION_SERVICE_DOCKER_IMAGE=${attestation_service_docker_image_repository}:${attestation_service_docker_image_tag}
docker pull $ATTESTATION_SERVICE_DOCKER_IMAGE

# Switch between Nexmo and Twilio
# TODO: Refactor
if [ $SMS_PROVIDERS == "nexmo" ]; then
  NEXMO_KEY=${nexmo_key}
  NEXMO_SECRET=${nexmo_secret}
  NEXMO_BLACKLIST=${nexmo_blacklist}

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
    $ATTESTATION_SERVICE_DOCKER_IMAGE -c "\
      (
        set -euo pipefail && \
        echo -n '$DATABASE_URL' > $DATA_DIR/databaseUrl && \
        echo -n '$ATTESTATION_KEY' > $DATA_DIR/attestationKey && \
        echo -n '$ACCOUNT_ADDRESS' > $DATA_DIR/accountAddress && \
        echo -n '$CELO_PROVIDER' > $DATA_DIR/celoProvider && \
        echo -n '$SMS_PROVIDERS' > $DATA_DIR/smsProviders && \
        echo -n '$NEXMO_KEY' > $DATA_DIR/nexmoKey && \
        echo -n '$NEXMO_SECRET' > $DATA_DIR/nexmoSecret && \
        echo -n '$NEXMO_BLACKLIST' > $DATA_DIR/nexmoBlacklist \
      ) && ( \
        yarn run db:create:dev && \
        yarn run db:migrate:dev && \
        node lib/index.js \
      )"
elif [ $SMS_PROVIDERS == "twilio" ]; then
  TWILIO_ACCOUNT_SID=${twilio_account_sid}
  TWILIO_MESSAGING_SERVICE_SID=${twilio_messaging_service_sid}
  TWILIO_AUTH_TOKEN=${twilio_auth_token}
  TWILIO_BLACKLIST=${twilio_blacklist}

  docker run --name attestation-service \
    --net=host --entrypoint /bin/sh -d \
    -v $DATA_DIR:$DATA_DIR \
    -e DATABASE_URL=$DATABASE_URL \
    -e ATTESTATION_KEY=$ATTESTATION_KEY \
    -e ACCOUNT_ADDRESS=$ACCOUNT_ADDRESS \
    -e CELO_PROVIDER=$CELO_PROVIDER \
    -e SMS_PROVIDERS=$SMS_PROVIDERS \
    -e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID \
    -e TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID \
    -e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN \
    -e TWILIO_BLACKLIST=$TWILIO_BLACKLIST \
    $ATTESTATION_SERVICE_DOCKER_IMAGE -c "\
      (
        set -euo pipefail && \
        echo -n '$DATABASE_URL' > $DATA_DIR/databaseUrl && \
        echo -n '$ATTESTATION_KEY' > $DATA_DIR/attestationKey && \
        echo -n '$ACCOUNT_ADDRESS' > $DATA_DIR/accountAddress && \
        echo -n '$CELO_PROVIDER' > $DATA_DIR/celoProvider && \
        echo -n '$SMS_PROVIDERS' > $DATA_DIR/smsProviders && \
        echo -n '$TWILIO_ACCOUNT_SID' > $DATA_DIR/twilioAccountSid && \
        echo -n '$TWILIO_MESSAGING_SERVICE_SID' > $DATA_DIR/twilioMessagingServiceSid && \
        echo -n '$TWILIO_AUTH_TOKEN' > $DATA_DIR/twilioAuthToken && \
        echo -n '$TWILIO_BLACKLIST' > $DATA_DIR/twilioBlacklist \
      ) && ( \
        yarn run db:create:dev && \
        yarn run db:migrate:dev && \
        node lib/index.js \
      )"
else
  echo "Variable \$SMS_PROVIDERS=$SMS_PROVIDERS must be one from nexmo or twilio"
  exit 1
fi
