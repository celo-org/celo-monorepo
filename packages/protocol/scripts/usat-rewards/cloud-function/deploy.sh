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
#
# Expects two secrets to exist in Secret Manager (created on first run if the
# env vars USAT_PRIVATE_KEY / DUNE_API_KEY are set):
#   usat-rewards-private-key, usat-rewards-dune-api-key
set -euo pipefail

PROJECT="${PROJECT:?set PROJECT to the GCP project id}"
REGION="${REGION:-europe-west1}"
SCHEDULE="${SCHEDULE:-0 9 * * 1}"
BUCKET="${BUCKET:-${PROJECT}-usat-rewards}"
DRY_RUN="${DRY_RUN:-0}"
FUNCTION_NAME="usat-rewards-distributor"
SA_NAME="usat-rewards-invoker"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

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

gcloud functions deploy "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --gen2 \
    --runtime python312 --entry-point distribute --source . \
    --trigger-http --no-allow-unauthenticated \
    --max-instances 1 --concurrency 1 --timeout 1800s --memory 512Mi \
    --set-env-vars "GCS_BUCKET=$BUCKET,DRY_RUN=$DRY_RUN" \
    --set-secrets "PRIVATE_KEY=usat-rewards-private-key:latest,DUNE_API_KEY=usat-rewards-dune-api-key:latest"

FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --gen2 --format 'value(url)')

gcloud functions add-invoker-policy-binding "$FUNCTION_NAME" \
    --project "$PROJECT" --region "$REGION" --member "serviceAccount:$SA_EMAIL"

if gcloud scheduler jobs describe "$FUNCTION_NAME" --project "$PROJECT" --location "$REGION" > /dev/null 2>&1; then
    gcloud scheduler jobs update http "$FUNCTION_NAME" \
        --project "$PROJECT" --location "$REGION" \
        --schedule "$SCHEDULE" --uri "$FUNCTION_URL" \
        --oidc-service-account-email "$SA_EMAIL"
else
    gcloud scheduler jobs create http "$FUNCTION_NAME" \
        --project "$PROJECT" --location "$REGION" \
        --schedule "$SCHEDULE" --uri "$FUNCTION_URL" --http-method POST \
        --oidc-service-account-email "$SA_EMAIL" \
        --attempt-deadline 1800s
fi

echo
echo "Deployed. Trigger manually with:"
echo "  gcloud scheduler jobs run $FUNCTION_NAME --project $PROJECT --location $REGION"
echo "Function URL: $FUNCTION_URL"
