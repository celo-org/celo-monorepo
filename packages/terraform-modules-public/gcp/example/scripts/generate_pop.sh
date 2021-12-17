#!/bin/bash
set -x

echo "Run this in /root/.celo on the validator"

######
# use this script on a validator to generate a proof of possession, needed for key rotation
CELO_IMAGE=us.gcr.io/celo-org/geth:mainnet
SIGNER_TO_AUTHORIZE=FIXME
VALIDATOR_ACCOUNT_ADDRESS=FIXME

# With $SIGNER_TO_AUTHORIZE as the new validator signer:
# On the new validator node which contains the new $SIGNER_TO_AUTHORIZE key
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $SIGNER_TO_AUTHORIZE $VALIDATOR_ACCOUNT_ADDRESS
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $SIGNER_TO_AUTHORIZE $VALIDATOR_ACCOUNT_ADDRESS --bls
