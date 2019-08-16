#!/bin/sh

CELO_VALIDATOR_ADDRESS='0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B'
CELO_VALIDATOR_GROUP_ADDRESS='0x456f41406B32c45D59E539e4BBA3D7898c3584dA'

TRANSFER_AMOUNT=100
NOTICE_PERIOD=5184000
DEPOSIT_AMOUNT=1000000000000000000

alias celocli="docker exec -t -i cli_container /celocli"

## account Module
# balance command
celocli account:balance $CELO_VALIDATOR_ADDRESS
celocli account:balance $CELO_VALIDATOR_GROUP_ADDRESS

# transferdollar comand
celocli account:transferdollar --from $CELO_VALIDATOR_ADDRESS --amountInWei $TRANSFER_AMOUNT --to $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:transferdollar --from $CELO_VALIDATOR_GROUP_ADDRESS --amountInWei $TRANSFER_AMOUNT --to $CELO_VALIDATOR_ADDRESS

# transfergold command
celocli account:transfergold --from $CELO_VALIDATOR_ADDRESS --amountInWei $TRANSFER_AMOUNT --to $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:transfergold --from $CELO_VALIDATOR_GROUP_ADDRESS --amountInWei $TRANSFER_AMOUNT --to $CELO_VALIDATOR_ADDRESS

celocli account:unlock --account $CELO_VALIDATOR_ADDRESS --password $PASSWORD
celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS --password $PASSWORD


## bonds module
# register command
celocli bonds:register --from $CELO_VALIDATOR_ADDRESS
celocli bonds:register --from $CELO_VALIDATOR_GROUP_ADDRESS

# deposit command
celocli bonds:deposit --from $CELO_VALIDATOR_ADDRESS --goldAmount $DEPOSIT_AMOUNT --noticePeriod $NOTICE_PERIOD
celocli bonds:deposit --from $CELO_VALIDATOR_GROUP_ADDRESS --goldAmount $DEPOSIT_AMOUNT --noticePeriod $NOTICE_PERIOD

# show command
celocli bonds:show $CELO_VALIDATOR_ADDRESS --noticePeriod $NOTICE_PERIOD
celocli bonds:show $CELO_VALIDATOR_GROUP_ADDRESS --noticePeriod $NOTICE_PERIOD

# list command
celocli bonds:list $CELO_VALIDATOR_ADDRESS
celocli bonds:list $CELO_VALIDATOR_GROUP_ADDRESS


## validator and validatorgroup modules
# register command
celocli validator:register \
  --id "validator-id" \
  --name "validator-name" \
  --url "validator-url" \
  --from $CELO_VALIDATOR_ADDRESS \
  --noticePeriod $NOTICE_PERIOD \
  --publicKey 0x`openssl rand -hex 64`
 
celocli validatorgroup:register \
  --id "validator-group-id" \
  --name "validator-group-name" \
  --url "validator-group-url" \
  --from $CELO_VALIDATOR_GROUP_ADDRESS \
  --noticePeriod $NOTICE_PERIOD

# membership/affiliation commands
celocli validator:affiliation --set $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS
celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS

# vote cmommand
celocli validatorgroup:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
celocli validatorgroup:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS

