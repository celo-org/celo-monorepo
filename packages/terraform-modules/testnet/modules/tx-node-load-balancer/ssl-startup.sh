#! /bin/bash

# ---- Set Up Logging ----

curl -sSO https://dl.google.com/cloudagents/install-logging-agent.sh
bash install-logging-agent.sh

echo "
@include config.d/*.conf
# Prometheus monitoring.
<source>
  @type prometheus
  port 24231
</source>
<source>
  @type prometheus_monitor
</source>

# Do not collect fluentd's own logs to avoid infinite loops.
<match fluent.**>
  @type null
</match>

# Add a unique insertId to each log entry that doesn't already have it.
# This helps guarantee the order and prevent log duplication.
<filter **>
@type add_insert_ids
</filter>

# Configure all sources to output to Google Cloud Logging
<match **>
  @type google_cloud
  buffer_type file
  buffer_path /var/log/google-fluentd/buffers
  # Set the chunk limit conservatively to avoid exceeding the recommended
  # chunk size of 5MB per write request.
  buffer_chunk_limit 512KB
  # Flush logs every 5 seconds, even if the buffer is not full.
  flush_interval 5s
  # Enforce some limit on the number of retries.
  disable_retry_limit false
  # After 3 retries, a given chunk will be discarded.
  retry_limit 3
  # Wait 10 seconds before the first retry. The wait interval will be doubled on
  # each following retry (20s, 40s...) until it hits the retry limit.
  retry_wait 10
  # Never wait longer than 5 minutes between retries. If the wait interval
  # reaches this limit, the exponentiation stops.
  # Given the default config, this limit should never be reached, but if
  # retry_limit and retry_wait are customized, this limit might take effect.
  max_retry_wait 300
  # Use multiple threads for processing.
  num_threads 8
  # Use the gRPC transport.
  use_grpc true
  # If a request is a mix of valid log entries and invalid ones, ingest the
  # valid ones and drop the invalid ones instead of dropping everything.
  partial_success true
  # Enable monitoring via Prometheus integration.
  enable_monitoring true
  monitoring_type opencensus
  detect_json true
</match>" > /etc/google-fluentd/google-fluentd.conf

echo "
<match docker_logs>
  @type rewrite_tag_filter
  <rule>
    key log
    pattern ^{
    tag docker_logs_json
  </rule>
  <rule>
    key log
    pattern ^[^{]
    tag docker_logs_plain
  </rule>
</match>

<filter docker_logs_json>
  @type parser
  key_name log
  reserve_data false
  <parse>
    @type json
  </parse>
</filter>

<filter docker_logs_plain>
  @type record_transformer
  <record>
    message $${record["log"]}
  </record>
</filter>
" > /etc/google-fluentd/config.d/docker.conf
systemctl restart google-fluentd

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
