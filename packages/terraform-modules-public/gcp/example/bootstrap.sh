#!/bin/bash
set -x

##########
# this will create a new project in GCP, and prepare the service account for it as well as necessary API's
# best practice is to use a separate git branch for each environment (eg blue/green)
# dependencies: gcloud cli, terraform cli

GCLOUD_ENV_FILE="gcloud.env"

echo "Sourcing gcloud env vars from gcloud.env."
if [ -f gcloud.env ]; then
    source gcloud.env
else
    cat <<'EOF' > $GCLOUD_ENV_FILE
    export TF_VAR_org_id=YOUR_GCLOUD_ORG_ID
    export TF_VAR_billing_account=YOUR_GCLOUD_BILLING_ACCOUNT_ID
    export TF_VAR_project=YOUR_TERRAFORM_PROJECT_NAME
    export TF_CREDS=~/.config/gcloud/${USER}-${TF_VAR_project}.json
    export GOOGLE_APPLICATION_CREDENTIALS=${TF_CREDS}
    export GOOGLE_PROJECT=${TF_VAR_project}
EOF
echo "Please set gcloud environment variables in $GCLOUD_ENV_FILE before running $0"
exit 1
fi

echo "Creating new gcloud project for terraform"
gcloud projects create ${TF_VAR_project} \
    --organization ${TF_VAR_org_id} \
    --set-as-default

echo "Linking new gcloud project to billing account"
gcloud beta billing projects link ${TF_VAR_project}  \
    --billing-account ${TF_VAR_billing_account}

echo "Creating iam service account for terraform"
gcloud iam service-accounts create terraform \
  --display-name "Terraform admin account"

echo "Creating gcloud keys on filesystem for terraform"
gcloud iam service-accounts keys create ${TF_CREDS} \
  --iam-account terraform@${TF_VAR_project}.iam.gserviceaccount.com

echo "Granting storage.admin and logging.configWriter and project editor and monitoring.admin roles to terraform service account."
gcloud projects add-iam-policy-binding ${TF_VAR_project} \
  --member serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com \
  --role roles/storage.admin
gcloud projects add-iam-policy-binding ${TF_VAR_project} \
  --member serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com \
  --role roles/logging.configWriter
gcloud projects add-iam-policy-binding ${TF_VAR_project} \
  --member serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com \
  --role roles/editor
  gcloud projects add-iam-policy-binding ${TF_VAR_project} \
  --member serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com \
  --role roles/monitoring.admin

echo "Enabling required gcp API's for terraform"
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable cloudbilling.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable serviceusage.googleapis.com
gcloud services enable stackdriver.googleapis.com
gcloud services enable clouderrorreporting.googleapis.com

echo "Enumerating default service account email address"
GCP_DEFAULT_SERVICE_ACCOUNT=`gcloud iam service-accounts list | grep 'Compute Engine default service account' | cut -d ' ' -f 7`
echo "export TF_VAR_GCP_DEFAULT_SERVICE_ACCOUNT=\"$GCP_DEFAULT_SERVICE_ACCOUNT\"" >> gcloud.env
#plan is to use this from within TF to grant explicit access to a logs bucket rather than use a broad storage.rw scope

echo "Creating a bucket for storing remote TFSTATE"
echo "Note that this bucket is created but is not enabled for Terraform state by default due to security concerns"
#note namespace on gcp cloud storage buckets is global, so this must be unique
TF_STATE_BUCKET=${TF_VAR_project}-tfstate
gsutil mb -p ${TF_VAR_project} gs://${TF_STATE_BUCKET}
#gsutil iam ch serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com:objectCreator,objectViewer gs://${TF_STATE_BUCKET}
#above is redundant, given that tf svc acct has storage.admin role, but granting it explictly here anyway.
# this works, but results in 'no change'. default svc account can still hit the TF_STATE_BUCKET
#gsutil iam ch -d serviceAccount:${TF_VAR_GCP_DEFAULT_SERVICE_ACCOUNT} gs://${TF_STATE_BUCKET}
cat > iam.txt << EOF
{
  "bindings": [
    {
      "members": [
        "projectOwner:${TF_VAR_project}"
      ],
      "role": "roles/storage.legacyBucketOwner"
    },
    {
      "members": [
        "projectViewer:${TF_VAR_project}"
      ],
      "role": "roles/storage.legacyBucketReader"
    },
    {
      "members": [
        "serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com"
      ],
      "role": "roles/storage.objectCreator"
    },
    {
      "members": [
        "serviceAccount:terraform@${TF_VAR_project}.iam.gserviceaccount.com"
      ],
      "role": "roles/storage.objectViewer"
    }
  ]
}
EOF

#### enable this if you want to use the GCS bucket for Terraform state.
# This is helpful if multiple people will be using terraform to manage the infrastructure
# Note that if this is enabled, you will need to manually restrict permissions to the TF_STATE_BUCKET to ensure that
# Unprivileged nodes (eg proxy, txnode, attestation) cannot use their default service account to read the Terraform state
# this is important because the Terraform state includes your private keys, etc.

#cat > backend.tf << EOF
#terraform {
# backend "gcs" {
#   bucket  = "${TF_STATE_BUCKET}"
#   prefix  = "terraform/state"
# }
#}
#EOF

echo "Initializing terraform"
terraform init


