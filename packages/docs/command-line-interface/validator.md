---
description: View and manage Validators
---

## Commands

### Affiliate

Affiliate a Validator with a Validator Group. This allows the Validator Group to add that Validator as a member. If the Validator is already a member of a Validator Group, affiliating with a different Group will remove the Validator from the first group's members.

```
USAGE
  $ celocli validator:affiliate GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  affiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 0x97f7333c51897469e8d98e7af8653aab468050a3
```

_See code: [packages/cli/src/commands/validator/affiliate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/affiliate.ts)_

### Deaffiliate

Deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.

```
USAGE
  $ celocli validator:deaffiliate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validator/deaffiliate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deaffiliate.ts)_

### Deregister

Deregister a Validator. Approximately 60 days after deregistration, the 10,000 Gold locked up to register the Validator will become possible to unlock. Note that deregistering a Validator will also deaffiliate and remove the Validator from any Group it may be an affiliate or member of.

```
USAGE
  $ celocli validator:deregister

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validator/deregister.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deregister.ts)_

### Force-deaffiliate

Force deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member. Used by stake-off admins in order to remove validators from the next epoch's validator set if they are down and consistently unresponsive, in order to preserve the health of the network. This feature will be removed once slashing for downtime is implemented.

```
USAGE
  $ celocli validator:force-deaffiliate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d       (required) Initiator

  --ledgerAddresses=ledgerAddresses                       [default: 1] If --useLedger is set, this will get the first N
                                                          addresses for local signing

  --ledgerConfirmAddress                                  Set it to ask confirmation for the address of the transaction
                                                          from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses           [default: [0]] If --useLedger is set, this will get the array
                                                          of index addresses for local signing. Example
                                                          --ledgerCustomAddresses "[4,99]"

  --useLedger                                             Set it to use a ledger wallet

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address

EXAMPLE
  force-deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --validator
  0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD
```

_See code: [packages/cli/src/commands/validator/force-deaffiliate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/force-deaffiliate.ts)_

### List

List registered Validators, their name (if provided), affiliation, uptime score, and public keys used for validating.

```
USAGE
  $ celocli validator:list

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/validator/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/list.ts)_

### Register

Register a new Validator

```
USAGE
  $ celocli validator:register

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsSignature=0x                                  (required) BLS Proof-of-Possession
  --ecdsaKey=0x                                      (required) ECDSA Public Key
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --yes                                              Answer yes to prompt

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --ecdsaKey
  0x049b7291ab8813a095d6b7913a7930ede5ea17466abd5e1a26c6c44f6df9a400a6f474080098b2c752c6c4871978ca977b90dcd3aed92bc9d564
  137c8dfa14ee72 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4
  db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsSignature
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900
```

_See code: [packages/cli/src/commands/validator/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)_

### Requirements

List the Locked Gold requirements for registering a Validator. This consists of a value, which is the amount of Celo Gold that needs to be locked in order to register, and a duration, which is the amount of time that Gold must stay locked following the deregistration of the Validator.

```
USAGE
  $ celocli validator:requirements

EXAMPLE
  requirements
```

_See code: [packages/cli/src/commands/validator/requirements.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/requirements.ts)_

### Show

Show information about a registered Validator.

```
USAGE
  $ celocli validator:show VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/validator/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/show.ts)_

### Signed-blocks

Display a graph of blocks and whether the given signer's signature is included in each. A green '.' indicates the signature is present in that block, a red '✘' indicates the signature is not present. A yellow '~' indicates the signer is not elected for that block.

```
USAGE
  $ celocli validator:signed-blocks

OPTIONS
  --at-block=at-block                                  latest block to examine for sginer activity
  --lookback=lookback                                  [default: 120] how many blocks to look back for signer activity
  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) address of the signer to check for signatures
  --width=width                                        [default: 40] line width for printing marks

EXAMPLES
  heartbeat --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631
  heartbeat --at-block 100000 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631
  heartbeat --lookback 500 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631
  heartbeat --lookback 50 --width 10 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code: [packages/cli/src/commands/validator/signed-blocks.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/signed-blocks.ts)_

### Status

Shows the consensus status of a validator. This command will show whether a validator is currently elected, would be elected if an election were to be run right now, and the percentage of blocks signed and number of blocks successfully proposed within a given window.

```
USAGE
  $ celocli validator:status

OPTIONS
  --all                                                   get the status of all registered validators

  --lookback=lookback                                     [default: 100] how many blocks to look back for signer
                                                          activity

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     address of the signer to check if elected and validating

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  address of the validator to check if elected and validating

EXAMPLES
  status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631
  status --all --lookback 100
```

_See code: [packages/cli/src/commands/validator/status.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/status.ts)_

### Update-bls-public-key

Update the BLS public key for a Validator to be used in consensus. Regular (ECDSA and BLS) key rotation is recommended for Validator operational security.

```
USAGE
  $ celocli validator:update-bls-public-key

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsPop=0x                                        (required) BLS Proof-of-Possession
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  update-bls-key --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4
  db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900
```

_See code: [packages/cli/src/commands/validator/update-bls-public-key.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/update-bls-public-key.ts)_
