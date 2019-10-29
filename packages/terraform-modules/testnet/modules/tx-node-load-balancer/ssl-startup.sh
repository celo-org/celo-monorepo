echo "hey!!!! wooo it worked"

mkdir -p /home/lego

/usr/bin/docker run \
  --rm \
  -u 2000 \
  -v /home/lego:/root/.lego \
  --env GCE_PROJECT=${gcloud_project} \
  --env LETSENCRYPT_EMAIL=${letsencrypt_email} \
  --env TARGET_PROXY=${target_https_proxy_name} \
  --env DOMAINS_LIST="-d ${forno_host}" \
  --env USE_STAGING_SERVER=true \
  --env CERT_ID_PREFIX=${cert_prefix} \
  --name=ssl-letsencrypt \
  tkporter/letsencrypt-gcloud-balancer:v02-fix-1
