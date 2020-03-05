#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=""
RELEASE=""
DOMAIN_NAME_OPT=""
ACTION=install
TEST_OPT=""
ZONE="us-west1-a"

while getopts ':utn:r:z:d:v:a:' flag; do
  case "${flag}" in
    u) ACTION=upgrade ;;
    t) TEST_OPT="--debug --dry-run" ;;
    n) NAMESPACE="${OPTARG}" ;;
    r) RELEASE="${OPTARG}" ;;
    z) ZONE="${OPTARG}" ;;
    d) DOMAIN_NAME_OPT="--set domain.name=${OPTARG}" ;;
    a) VERIFICATION_REWARDS_ADDRESS="${OPTARG}" ;;
    *) echo "Unexpected option ${flag}" ;;
  esac
done
shift $((OPTIND -1))

[ -z "$RELEASE" ] && echo "Need to set release via the -r flag" && exit 1;
[ -z "$NAMESPACE" ] && NAMESPACE=$RELEASE

# Create blockscout DB only if we are installing
if [ "$ACTION" = "install" ]; then

  # Create a new username and password
  BLOCKSCOUT_DB_USERNAME=$(openssl rand -hex 12)
  BLOCKSCOUT_DB_PASSWORD=$(openssl rand -hex 24)

  if [ "z$TEST_OPT" = "z" ]; then
    echo "Creating Cloud SQL database, this might take a minute or two ..."
    gcloud sql instances create $RELEASE --zone $ZONE --database-version POSTGRES_9_6 --cpu 1 --memory 4G
    gcloud sql users create $BLOCKSCOUT_DB_USERNAME -i $RELEASE --password $BLOCKSCOUT_DB_PASSWORD
    gcloud sql databases create blockscout -i $RELEASE
    kubectl create namespace $NAMESPACE

    # This command assumes the secret being available on the cluster in the default namespace
    kubectl get secret blockscout-cloudsql-credentials --namespace default --export -o yaml |\
    grep -v creationTimestamp | grep -v resourceVersion | grep -v selfLink | grep -v uid | grep -v namespace |\
    kubectl apply --namespace=$NAMESPACE -f -
  fi
fi

# Get the connection name for the database
BLOCKSCOUT_DB_CONNECTION_NAME=$(gcloud sql instances describe $RELEASE --format="value(connectionName)")

if [ "$ACTION" = "install" ]; then

  echo "Deploying new environment..."

  helm install ./testnet --name $RELEASE --namespace $NAMESPACE \
  $DOMAIN_NAME_OPT $TEST_OPT \
  --set miner.verificationrewards=$VERIFICATION_REWARDS_ADDRESS \
  --set blockscout.db.username=$BLOCKSCOUT_DB_USERNAME \
  --set blockscout.db.password=$BLOCKSCOUT_DB_PASSWORD \
  --set blockscout.db.connection_name=$BLOCKSCOUT_DB_CONNECTION_NAME

elif [ "$ACTION" = "upgrade" ]; then

  # Get existing username and password from the database
  BLOCKSCOUT_DB_USERNAME=`kubectl get secret $RELEASE-blockscout --export -o jsonpath='{.data.DB_USERNAME}' -n $NAMESPACE | base64 --decode`
  BLOCKSCOUT_DB_PASSWORD=`kubectl get secret $RELEASE-blockscout --export -o jsonpath='{.data.DB_PASSWORD}' -n $NAMESPACE | base64 --decode`

  echo "Upgrading existing environment..."

  helm upgrade $RELEASE ./testnet \
  $DOMAIN_NAME_OPT $TEST_OPT \
  --set miner.verificationrewards=$VERIFICATION_REWARDS_ADDRESS \
  --set blockscout.db.username=$BLOCKSCOUT_DB_USERNAME \
  --set blockscout.db.password=$BLOCKSCOUT_DB_PASSWORD \
  --set blockscout.db.connection_name=$BLOCKSCOUT_DB_CONNECTION_NAME
fi
