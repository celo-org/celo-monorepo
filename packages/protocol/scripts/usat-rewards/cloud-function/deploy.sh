#!/bin/bash
# Deploy the USA₮ rewards distributor as a Cloud Function (gen2) with a
# Cloud Scheduler trigger.
#
# Usage:
#   PROJECT=my-gcp-project ./deploy.sh
#
# Overridable env vars:
#   REGION       default europe-west1
#   SCHEDULE     default "0 9 * * 1"  (Mondays 09:00 UTC)
#   BUCKET       default ${PROJECT}-usat-rewards
#   DRY_RUN      default 0 — set 1 to deploy in report-only mode first
#   TIMEOUT_SECONDS  function request timeout, default 3600
#
# Function settings the deployer can tune are read from this shell's own
# environment and forwarded: MAX_PER_WALLET, MAX_TOTAL_PER_RUN,
# DUNE_POLL_SECONDS, MIN_GAS_CELO, FEE_CURRENCY_ADAPTER,
# ALLOW_DISTRIBUTOR_CHANGE. Anything left unset keeps the code default.
#
# Expects two secrets to exist in Secret Manager (created on first run if the
# env vars USAT_PRIVATE_KEY / DUNE_API_KEY are set):
#   usat-rewards-private-key, usat-rewards-dune-api-key
#
# Creates and uses a dedicated runtime service account (usat-rewards-runtime)
# with object access to the state bucket and read access to both secrets.
set -euo pipefail

PROJECT="${PROJECT:?set PROJECT to the GCP project id}"
REGION="${REGION:-europe-west1}"
SCHEDULE="${SCHEDULE:-0 9 * * 1}"
BUCKET="${BUCKET:-${PROJECT}-usat-rewards}"
DRY_RUN="${DRY_RUN:-0}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-3600}"
FUNCTION_NAME="usat-rewards-distributor"
SA_NAME="usat-rewards-invoker"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
RUNTIME_SA_NAME="usat-rewards-runtime"
RUNTIME_SA_EMAIL="${RUNTIME_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

cd "$(dirname "$0")"

gcloud services enable cloudfunctions.googleapis.com run.googleapis.com \
    cloudscheduler.googleapis.com secretmanager.googleapis.com \
    storage.googleapis.com --project "$PROJECT"

# State bucket (ledger + run lock)
if ! gcloud storage buckets describe "gs://$BUCKET" --project "$PROJECT" > /dev/null 2>&1; then
    gcloud storage buckets create "gs://$BUCKET" --project "$PROJECT" --location "$REGION"
fi

# Secrets — created only if the corresponding env var is provided
create_secret() {
    local name="$1" value="$2"
    if ! gcloud secrets describe "$name" --project "$PROJECT" > /dev/null 2>&1; then
        if [ -z "$value" ]; then
            echo "Secret $name missing — export its env var or create it manually:" >&2
            echo "  printf '%s' '<value>' | gcloud secrets create $name --data-file=- --project $PROJECT" >&2
            exit 1
        fi
        printf '%s' "$value" | gcloud secrets create "$name" --data-file=- --project "$PROJECT"
    fi
}
create_secret usat-rewards-private-key "${USAT_PRIVATE_KEY:-}"
create_secret usat-rewards-dune-api-key "${DUNE_API_KEY:-}"

# Invoker service account for Cloud Scheduler
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT" > /dev/null 2>&1; then
    gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT" \
        --display-name "USA₮ rewards scheduler invoker"
fi

# Runtime service account. An explicit identity with exactly the two grants the
# function needs — object access to the state bucket and read access to both
# secret payloads — because the default runtime account has neither in a project
# without broad legacy roles, and the function would fail on its first lock
# upload or secret resolution.
if ! gcloud iam service-accounts describe "$RUNTIME_SA_EMAIL" --project "$PROJECT" > /dev/null 2>&1; then
    gcloud iam service-accounts create "$RUNTIME_SA_NAME" --project "$PROJECT" \
        --display-name "USA₮ rewards distributor runtime"
fi

gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --project "$PROJECT" \
    --member "serviceAccount:$RUNTIME_SA_EMAIL" --role roles/storage.objectUser

for secret in usat-rewards-private-key usat-rewards-dune-api-key; do
    gcloud secrets add-iam-policy-binding "$secret" --project "$PROJECT" \
        --member "serviceAccount:$RUNTIME_SA_EMAIL" --role roles/secretmanager.secretAccessor
done

# --set-env-vars replaces the function's whole environment, so every value the
# function should keep has to be restated on each deploy: a tuned setting that
# is only passed once silently reverts to the code default on the next redeploy.
# The optional ones are therefore forwarded from this shell whenever they are
# set — including when set to empty, which is how FEE_CURRENCY_ADAPTER disables
# the fee-currency fallback.
ENV_VARS="GCS_BUCKET=$BUCKET,DRY_RUN=$DRY_RUN"
ENV_VARS="$ENV_VARS,MAX_PER_WALLET=${MAX_PER_WALLET:-5000000}"
ENV_VARS="$ENV_VARS,MAX_TOTAL_PER_RUN=${MAX_TOTAL_PER_RUN:-5000000000}"
ENV_VARS="$ENV_VARS,DUNE_POLL_SECONDS=${DUNE_POLL_SECONDS:-1500}"
# The lock-staleness window is derived from the request timeout, so the function
# has to know the value configured here.
ENV_VARS="$ENV_VARS,FUNCTION_TIMEOUT_SECONDS=$TIMEOUT_SECONDS"
for var in MIN_GAS_CELO FEE_CURRENCY_ADAPTER ALLOW_DISTRIBUTOR_CHANGE; do
    if [ -n "${!var+set}" ]; then
        ENV_VARS="$ENV_VARS,$var=${!var}"
    fi
done

gcloud functions deploy "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --gen2 \
    --runtime python312 --entry-point distribute --source . \
    --trigger-http --no-allow-unauthenticated \
    --service-account "$RUNTIME_SA_EMAIL" \
    --max-instances 1 --concurrency 1 --timeout "${TIMEOUT_SECONDS}s" --memory 512Mi \
    --set-env-vars "$ENV_VARS" \
    --set-secrets "PRIVATE_KEY=usat-rewards-private-key:latest,DUNE_API_KEY=usat-rewards-dune-api-key:latest"

FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --gen2 --format 'value(url)')

gcloud functions add-invoker-policy-binding "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --member "serviceAccount:$SA_EMAIL"

# A retry policy is not optional here: the function answers 503 whenever the
# work is unfinished but resumable — a Dune execution still running, or a
# broadcast transfer not yet mined — and Cloud Scheduler's default retryCount of
# 0 would drop those runs until the next scheduled slot, a week away. The
# backoff is minutes-to-an-hour because what it waits for is Dune indexing and
# block confirmation, not a flaky endpoint.
RETRY_FLAGS=(--max-retry-attempts 5 --min-backoff 5m --max-backoff 1h --attempt-deadline 1800s)

if gcloud scheduler jobs describe "$FUNCTION_NAME" --project "$PROJECT" --location "$REGION" > /dev/null 2>&1; then
    gcloud scheduler jobs update http "$FUNCTION_NAME" \
        --project "$PROJECT" --location "$REGION" \
        --schedule "$SCHEDULE" --uri "$FUNCTION_URL" \
        --oidc-service-account-email "$SA_EMAIL" \
        "${RETRY_FLAGS[@]}"
else
    gcloud scheduler jobs create http "$FUNCTION_NAME" \
        --project "$PROJECT" --location "$REGION" \
        --schedule "$SCHEDULE" --uri "$FUNCTION_URL" --http-method POST \
        --oidc-service-account-email "$SA_EMAIL" \
        "${RETRY_FLAGS[@]}"
fi

echo
echo "Deployed. Trigger manually with:"
echo "  gcloud scheduler jobs run $FUNCTION_NAME --project $PROJECT --location $REGION"
echo "Function URL: $FUNCTION_URL"
