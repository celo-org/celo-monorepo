#!/bin/bash
set -x

DOMAIN="EXAMPLE.COM"

#metadata process from scratch
#create validator metadata 
celocli account:create-metadata ./validator_metadata.json --from $CELO_VALIDATOR_RG_ADDRESS

# On your local machine
# requires that the $CELO_ATTESTATION_SIGNER_ADDRESS account be unlocked, and that $CELO_ATTESTATION_SERVICE_URL be defined 
celocli account:claim-attestation-service-url ./validator_metadata.json --url $CELO_ATTESTATION_SERVICE_URL --from $CELO_ATTESTATION_SIGNER_ADDRESS


#now create group metadata
celocli account:create-metadata ./group_metadata.json --from $CELO_VALIDATOR_GROUP_RG_ADDRESS

#set the group name
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property name --value $DOMAIN



#Now we can generate a claim for the domain associated with this name
celocli account:claim-domain ./group_metadata.json --domain $DOMAIN --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS --useLedger --ledgerCustomAddresses=[2]

#put the TXT record this spits out into DNS

#make sure it worked
celocli account:show-metadata ./group_metadata.json

#First lets claim the validator address from the group account
# On your local machine
celocli account:claim-account ./group_metadata.json --address $CELO_VALIDATOR_RG_ADDRESS --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS --useLedger --ledgerCustomAddresses=[2]

#Now let's submit the corresponding claim from the validator account on the group account
#(note: if you followed the directions to set up the attestation service, you may have already
#registered metadata for your validator. If that is the case, skip the steps to create the validator's metadata
#and just add the account claim.)

# Requires that validator vote signer account be unlocked
celocli account:claim-account ./validator_metadata.json --address $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS

#push these to s3
s3cmd put validator_metadata.json s3://$DOMAIN/metadata/
s3cmd put group_metadata.json s3://$DOMAIN/metadata/


# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property metaURL --value 'https://www.$DOMAIN/metadata/group_metadata.json' --useLedger --ledgerCustomAddresses=[0]
celocli releasegold:set-account --contract $CELO_VALIDATOR_RG_ADDRESS --property metaURL --value 'https://www.$DOMAIN/metadata/validator_metadata.json' --useLedger --ledgerCustomAddresses=[1]


#verify everything worked
celocli account:get-metadata $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli account:get-metadata $CELO_VALIDATOR_RG_ADDRESS
