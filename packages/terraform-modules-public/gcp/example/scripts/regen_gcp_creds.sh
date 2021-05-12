#!/bin/bash
set -x

GCLOUD_ENV_FILE="gcloud.env"

echo "Sourcing gcloud env vars from gcloud.env."
if [ -f gcloud.env ]; then
    source gcloud.env
else
echo "Please set gcloud environment variables in $GCLOUD_ENV_FILE before running $0"
exit 1
fi

echo "Creating gcloud keys on filesystem for terraform"
gcloud iam service-accounts keys create ${TF_CREDS} \
  --iam-account terraform@${TF_VAR_project}.iam.gserviceaccount.com

gcloud config set project $GOOGLE_PROJECT