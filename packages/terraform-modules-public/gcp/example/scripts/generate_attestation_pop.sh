#!/bin/bash
set -x

######
# use this script on an attestation signer tx-node to generate a proof of possession, needed for key rotation

CELO_IMAGE=us.gcr.io/celo-org/celo-node:mainnet
CELO_ATTESTATION_SIGNER_ADDRESS=FIXME
CELO_VALIDATOR_RG_ADDRESS=FIXME

# On the Attestation machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $CELO_ATTESTATION_SIGNER_ADDRESS $CELO_VALIDATOR_RG_ADDRESS
