#!/bin/bash
set -x

######
# use this script to authorize a new attestation signer
# signed by the validator release gold account

CELO_ATTESTATION_SIGNER_SIGNATURE=FIXME
CELO_ATTESTATION_SIGNER_ADDRESS=FIXME
CELO_VALIDATOR_RG_ADDRESS=FIXME
LEDGER_INDEX=0

npx celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role attestation --signature 0x$CELO_ATTESTATION_SIGNER_SIGNATURE --signer $CELO_ATTESTATION_SIGNER_ADDRESS --useLedger --ledgerCustomAddresses=$LEDGER_INDEX


