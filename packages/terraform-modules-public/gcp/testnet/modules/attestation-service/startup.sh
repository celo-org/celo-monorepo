#!/bin/bash

# ---- Config /etc/screenrc ----
cat <<'EOF' > '/etc/screenrc'
bindkey -k k1 select 1  #  F1 = screen 1
bindkey -k k2 select 2  #  F2 = screen 2
bindkey -k k3 select 3  #  F3 = screen 3
bindkey -k k4 select 4  #  F4 = screen 4
bindkey -k k5 select 5  #  F5 = screen 5
bindkey -k k6 select 6  #  F6 = screen 6
bindkey -k k7 select 7  #  F7 = screen 7
bindkey -k k8 select 8  #  F8 = screen 8
bindkey -k k9 select 9  #  F9 = screen 9
bindkey -k F1 prev      # F11 = prev
bindkey -k F2 next      # F12 = next
EOF

# ---- Useful aliases ----
echo "alias ll='ls -laF'" >> /etc/skel/.bashrc
echo "alias ll='ls -laF'" >> /root/.profile

function save_variable {
  local var=$1
  local file=$2

  [ -n "$var" ] && echo -n "$var" > "$file"
}

# ---- Install Stackdriver Agent
echo "Installing Stackdriver agent" | logger
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
bash add-monitoring-agent-repo.sh
apt update -y
apt install -y stackdriver-agent
systemctl restart stackdriver-agent

# ---- Install Fluent Log Collector
echo "Installing google fluent log collector agent" | logger
curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
bash add-logging-agent-repo.sh
apt update -y
apt install -y google-fluentd
apt install -y google-fluentd-catch-all-config-structured
systemctl restart google-fluentd

# ---- Install Docker ----

echo "Installing Docker..." | logger
apt update -y && apt upgrade -y
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg2 htop
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

# ---- Set Up and Run Attestation Service ----

DATA_DIR=/root/.celo
mkdir -p $DATA_DIR
ATTESTATION_KEY='${attestation_key}'
ACCOUNT_ADDRESS='${account_address}'
ATTESTATION_SIGNER_ADDRESS='${account_address}'
CELO_VALIDATOR_ADDRESS='${validator_release_gold_address}'
CELO_PROVIDER='${celo_provider}'
SMS_PROVIDERS='${sms_providers}'
NEXMO_KEY='${nexmo_key}'
NEXMO_SECRET='${nexmo_secret}'
NEXMO_BLACKLIST='${nexmo_blacklist}'
TWILIO_ACCOUNT_SID='${twilio_account_sid}'
TWILIO_MESSAGING_SERVICE_SID='${twilio_messaging_service_sid}'
TWILIO_AUTH_TOKEN='${twilio_auth_token}'
TWILIO_BLACKLIST='${twilio_blacklist}'

ATTESTATION_SERVICE_DOCKER_IMAGE='${attestation_service_docker_image_repository}:${attestation_service_docker_image_tag}'
docker pull "$ATTESTATION_SERVICE_DOCKER_IMAGE"

# Run the Cloud SQL Proxy

cat <<EOF >/etc/systemd/system/cloudsql.service
[Unit]
Description=Docker Container %N
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run \\
  --rm \\
  -v /cloudsql:/cloudsql \\
  -p 127.0.0.1:5432:5432 \\
  gcr.io/cloudsql-docker/gce-proxy:1.11 \\
    /cloud_sql_proxy \\
    -instances=${db_connection_name}=tcp:0.0.0.0:5432
ExecStop=/usr/bin/docker stop -t 60 %N

[Install]
WantedBy=default.target
EOF
DATABASE_URL="postgres://${db_username}:${db_password}@127.0.0.1:5432/postgres"
systemctl daemon-reload
systemctl enable cloudsql.service
systemctl restart cloudsql.service

# Saving variables
save_variable "$DATABASE_URL" "$DATA_DIR/databaseUrl"
save_variable "$ATTESTATION_KEY" "$DATA_DIR/attestationKey"
save_variable "$ATTESTATION_SIGNER_ADDRESS" "$DATA_DIR/attestationSignerAddress"
save_variable "$ACCOUNT_ADDRESS" "$DATA_DIR/accountAddress"
save_variable "$CELO_VALIDATOR_ADDRESS" "$DATA_DIR/validatorAddress"
save_variable "$CELO_PROVIDER" "$DATA_DIR/celoProvider"
save_variable "$SMS_PROVIDERS" "$DATA_DIR/smsProviders"
save_variable "$NEXMO_KEY" "$DATA_DIR/nexmoKey"
save_variable "$NEXMO_SECRET" "$DATA_DIR/nexmoSecret"
save_variable "$NEXMO_BLACKLIST" "$DATA_DIR/nexmoBlacklist"
save_variable "$TWILIO_ACCOUNT_SID" "$DATA_DIR/twilioAccountSid"
save_variable "$TWILIO_MESSAGING_SERVICE_SID" "$DATA_DIR/twilioMessagingServiceSid"
save_variable "$TWILIO_AUTH_TOKEN" "$DATA_DIR/twilioAuthToken"
save_variable "$TWILIO_BLACKLIST" "$DATA_DIR/twilioBlacklist"

cat <<EOF >/etc/systemd/system/attestation-service.service
[Unit]
Description=Docker Container %N
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run \\
  --rm \\
  --name attestation-service \\
  --net=host \\
  --entrypoint /bin/bash \\
  -v $DATA_DIR:$DATA_DIR \\
  -e NODE_ENV=production \\
  -e PORT=80 \\
  -e DATABASE_URL="$DATABASE_URL" \\
  -e ACCOUNT_ADDRESS="$ACCOUNT_ADDRESS" \\
  -e ATTESTATION_SIGNER_ADDRESS="$ATTESTATION_SIGNER_ADDRESS" \\
  -e CELO_VALIDATOR_ADDRESS="$CELO_VALIDATOR_ADDRESS" \\
  -e ATTESTATION_KEY="$ATTESTATION_KEY" \\
  -e CELO_PROVIDER="$CELO_PROVIDER" \\
  -e SMS_PROVIDERS="$SMS_PROVIDERS" \\
  -e NEXMO_KEY="$NEXMO_KEY" \\
  -e NEXMO_SECRET="$NEXMO_SECRET" \\
  -e NEXMO_BLACKLIST="$NEXMO_BLACKLIST" \\
  -e TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \\
  -e TWILIO_MESSAGING_SERVICE_SID="$TWILIO_MESSAGING_SERVICE_SID" \\
  -e TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \\
  -e TWILIO_BLACKLIST="$TWILIO_BLACKLIST" \\
  $ATTESTATION_SERVICE_DOCKER_IMAGE -c "\\
  ( \\
      cd /celo-monorepo/packages/attestation-service && \\
      yarn run db:migrate && \\
      yarn start \\
  )"
ExecStop=/usr/bin/docker stop -t 30 %N

[Install]
WantedBy=default.target
EOF
systemctl daemon-reload
systemctl enable attestation-service.service
systemctl restart attestation-service.service

echo "Adding DC to docker group"
usermod -aG docker dc