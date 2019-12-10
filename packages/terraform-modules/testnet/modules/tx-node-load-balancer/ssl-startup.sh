#! /bin/bash

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
gcloud auth configure-docker

# use GCP logging for Docker containers
echo '{"log-driver":"gcplogs"}' > /etc/docker/daemon.json
systemctl restart docker

mkdir -p /home/lego

# use --env USE_STAGING_SERVER=true to test staging

/usr/bin/docker run -d \
  -v /home/lego:/root/.lego \
  --restart always \
  --env GCE_PROJECT=${gcloud_project} \
  --env LETSENCRYPT_EMAIL=${letsencrypt_email} \
  --env TARGET_PROXY=${target_https_proxy_name} \
  --env DOMAINS_LIST="-d ${forno_host}" \
  --env CERT_ID_PREFIX=${cert_prefix} \
  --name=ssl-letsencrypt \
  bloomapi/letsencrypt-gcloud-balancer:v1.0.2
