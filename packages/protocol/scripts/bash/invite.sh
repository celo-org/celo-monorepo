#!/usr/bin/env bash
set -euo pipefail

# Sends an invite code to a user that can be used to verify and redeem an escrowed payment.
#
# Flags:
# -n: Name of the network to increment balances on
# -p: phone number of the user to invite

NETWORK=""
PHONE=""
FAST=""
while getopts 'n:p:f:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    p) PHONE="$OPTARG" ;;
    f) FAST="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$PHONE" ] && echo "Need to set the PHONE via the -p flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

if [ "$FAST" == true ] ; then
  echo "Fast mode is on, protocol won't be rebuilt and twilio config won't be decrypted with KMS."
else
  yarn run build
  gcloud config set project celo-testnet
  gcloud kms decrypt --ciphertext-file=twilio-config.enc --plaintext-file=twilio-config.js \
    --key=github-key --keyring=celo-keyring --location=global
fi

yarn run truffle exec ./scripts/truffle/invite.js \
  --network $NETWORK --stableValue 5 --goldValue 5 \
  --build_directory $PWD/build/$NETWORK --phone $PHONE
