# Validator

View and manage Validators

## `celocli validator:affiliate GROUPADDRESS`

Affiliate a Validator with a Validator Group. This allows the Validator Group to add that Validator as a member. If the Validator is already a member of a Validator Group, affiliating with a different Group will remove the Validator from the first group's members.

```text
Affiliate a Validator with a Validator Group. This allows the Validator Group to add that Validator as a member. If the Validator is already a member of a Validator Group, affiliating with a different Group will remove the Validator from the first group's members.

USAGE
  $ celocli validator:affiliate GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's
                                                     address

  --globalHelp                                       View all available global flags

  --yes                                              Answer yes to prompt

EXAMPLE
  affiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
  0x97f7333c51897469e8d98e7af8653aab468050a3
```

_See code:_ [_src/commands/validator/affiliate.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/affiliate.ts)

## `celocli validator:deaffiliate`

Deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.

```text
Deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.

USAGE
  $ celocli validator:deaffiliate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's
                                                     address

  --globalHelp                                       View all available global flags

EXAMPLE
  deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code:_ [_src/commands/validator/deaffiliate.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deaffiliate.ts)

## `celocli validator:deregister`

Deregister a Validator. Approximately 60 days after the validator is no longer part of any group, it will be possible to deregister the validator and start unlocking the CELO. If you wish to deregister your validator, you must first remove it from it's group, such as by deaffiliating it, then wait the required 60 days before running this command.

```text
Deregister a Validator. Approximately 60 days after the validator is no longer part of any group, it will be possible to deregister the validator and start unlocking the CELO. If you wish to deregister your validator, you must first remove it from it's group, such as by deaffiliating it, then wait the required 60 days before running this command.

USAGE
  $ celocli validator:deregister

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's
                                                     address

  --globalHelp                                       View all available global flags

EXAMPLE
  deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code:_ [_src/commands/validator/deregister.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deregister.ts)

## `celocli validator:downtime-slash`

Downtime slash a validator

```text
Downtime slash a validator

USAGE
  $ celocli validator:downtime-slash

OPTIONS
  --beforeBlock=beforeBlock
      Slash for slashable downtime window before provided block

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
      (required) From address to perform the slash (reward recipient)

  --globalHelp
      View all available global flags

  --intervals='[0:1], [1:2]'
      Array of intervals, ordered by min start to max end

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
      Validator (signer or account) address

  --validators='["0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD",
  "0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95"]'
      Validator (signer or account) address list

EXAMPLES
  downtime-slash     --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95     --validator
  0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD     --intervals "[100:150), [150:200)"

  downtime-slash     --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95     --validator
  0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD     --slashableDowntimeBeforeBlock 200
```

_See code:_ [_src/commands/validator/downtime-slash.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/downtime-slash.ts)

## `celocli validator:force-deaffiliate`

Force deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member. Used by stake-off admins in order to remove validators from the next epoch's validator set if they are down and consistently unresponsive, in order to preserve the health of the network. This feature will be removed once slashing for downtime is implemented.

```text
Force deaffiliate a Validator from a Validator Group, and remove it from the Group if it is also a member.  Used by stake-off admins in order to remove validators from the next epoch's validator set if they are down and consistently unresponsive, in order to preserve the health of the network. This feature will be removed once slashing for downtime is implemented.

USAGE
  $ celocli validator:force-deaffiliate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d       (required) Initiator

  --globalHelp                                            View all available global
                                                          flags

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address

EXAMPLE
  force-deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --validator
  0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD
```

_See code:_ [_src/commands/validator/force-deaffiliate.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/force-deaffiliate.ts)

## `celocli validator:list`

List registered Validators, their name \(if provided\), affiliation, uptime score, and public keys used for validating.

```text
List registered Validators, their name (if provided), affiliation, uptime score, and public keys used for validating.

USAGE
  $ celocli validator:list

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  list
```

_See code:_ [_src/commands/validator/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/list.ts)

## `celocli validator:register`

Register a new Validator

```text
Register a new Validator

USAGE
  $ celocli validator:register

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsSignature=0x                                  (required) BLS Proof-of-Possession
  --ecdsaKey=0x                                      (required) ECDSA Public Key

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the
                                                     Validator

  --globalHelp                                       View all available global flags

  --yes                                              Answer yes to prompt

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --ecdsaKey
  0x049b7291ab8813a095d6b7913a7930ede5ea17466abd5e1a26c6c44f6df9a400a6f474080098b2c752c6
  c4871978ca977b90dcd3aed92bc9d564137c8dfa14ee72 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde1115
  4f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be
  3f5d7aaddb0b06fc9aff00 --blsSignature
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35
  664ea3923900
```

_See code:_ [_src/commands/validator/register.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)

## `celocli validator:requirements`

List the Locked Gold requirements for registering a Validator. This consists of a value, which is the amount of CELO that needs to be locked in order to register, and a duration, which is the amount of time that CELO must stay locked following the deregistration of the Validator.

```text
List the Locked Gold requirements for registering a Validator. This consists of a value, which is the amount of CELO that needs to be locked in order to register, and a duration, which is the amount of time that CELO must stay locked following the deregistration of the Validator.

USAGE
  $ celocli validator:requirements

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  requirements
```

_See code:_ [_src/commands/validator/requirements.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/requirements.ts)

## `celocli validator:set-bitmaps`

Set validator signature bitmaps for provided intervals

```text
Set validator signature bitmaps for provided intervals

USAGE
  $ celocli validator:set-bitmaps

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d            (required) From address
                                                               to sign set bitmap
                                                               transactions

  --globalHelp                                                 View all available global
                                                               flags

  --intervals='[0:1], [1:2]'                                   Array of intervals,
                                                               ordered by min start to
                                                               max end

  --slashableDowntimeBeforeBlock=slashableDowntimeBeforeBlock  Set all bitmaps for
                                                               slashable downtime window
                                                               before provided block

  --slashableDowntimeBeforeLatest                              Set all bitmaps for
                                                               slashable downtime window
                                                               before latest block

EXAMPLES
  set-bitmaps --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
  --slashableDowntimeBeforeBlock 10000

  set-bitmaps --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --intervals "[0:100],
  (100:200]"
```

_See code:_ [_src/commands/validator/set-bitmaps.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/set-bitmaps.ts)

## `celocli validator:show VALIDATORADDRESS`

Show information about a registered Validator.

```text
Show information about a registered Validator.

USAGE
  $ celocli validator:show VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code:_ [_src/commands/validator/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/show.ts)

## `celocli validator:signed-blocks`

Display a graph of blocks and whether the given signer's signature is included in each. A green '.' indicates the signature is present in that block, a red '✘' indicates the signature is not present. A yellow '~' indicates the signer is not elected for that block.

```text
Display a graph of blocks and whether the given signer's signature is included in each. A green '.' indicates the signature is present in that block, a red '✘' indicates the signature is not present. A yellow '~' indicates the signer is not elected for that block.

USAGE
  $ celocli validator:signed-blocks

OPTIONS
  --at-block=at-block
      latest block to examine for signer activity

  --globalHelp
      View all available global flags

  --lookback=lookback
      [default: 120] how many blocks to look back for signer activity

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
      address of the signer to check for signatures

  --signers='["0xb7ef0985bdb4f19460A29d9829aA1514B181C4CD",
  "0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95"]'
      list of signer addresses to check for signatures

  --slashableDowntimeLookback
      lookback of slashableDowntime

  --wasDownWhileElected
      indicate whether a validator was down while elected for range

  --width=width
      [default: 40] line width for printing marks

EXAMPLES
  signed-blocks --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631

  signed-blocks --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631 --follow

  signed-blocks --at-block 100000 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631

  signed-blocks --lookback 500 --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631

  signed-blocks --lookback 50 --width 10 --signer
  0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code:_ [_src/commands/validator/signed-blocks.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/signed-blocks.ts)

## `celocli validator:status`

Shows the consensus status of a validator. This command will show whether a validator is currently elected, would be elected if an election were to be run right now, and the percentage of blocks signed and number of blocks successfully proposed within a given window.

```text
Shows the consensus status of a validator. This command will show whether a validator is currently elected, would be elected if an election were to be run right now, and the percentage of blocks signed and number of blocks successfully proposed within a given window.

USAGE
  $ celocli validator:status

OPTIONS
  -x, --extended                                          show extra columns

  --all                                                   get the status of all
                                                          registered validators

  --columns=columns                                       only show provided columns
                                                          (comma-separated)

  --csv                                                   output is csv format [alias:
                                                          --output=csv]

  --end=end                                               [default: -1] what block to
                                                          end at when looking at signer
                                                          activity. defaults to the
                                                          latest block

  --filter=filter                                         filter property by partial
                                                          string matching, ex: name=foo

  --globalHelp                                            View all available global
                                                          flags

  --no-header                                             hide table header from output

  --no-truncate                                           do not truncate output to fit
                                                          screen

  --output=csv|json|yaml                                  output in a more machine
                                                          friendly format

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     address of the signer to check
                                                          if elected and validating

  --sort=sort                                             property to sort by (prepend
                                                          '-' for descending)

  --start=start                                           [default: -1] what block to
                                                          start at when looking at
                                                          signer activity. defaults to
                                                          the last 100 blocks

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  address of the validator to
                                                          check if elected and
                                                          validating

EXAMPLES
  status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631

  status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631 --start 1480000

  status --all --start 1480000 --end 1490000
```

_See code:_ [_src/commands/validator/status.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/status.ts)

## `celocli validator:update-bls-public-key`

Update the BLS public key for a Validator to be used in consensus.

```text
Update the BLS public key for a Validator to be used in consensus.

Regular (ECDSA and BLS) key rotation is recommended for Validator operational security.

WARNING: By default, the BLS key used by the validator node is derived from the ECDSA private key. As a result, rotating the BLS key without rotating the ECDSA key will result in validator downtime without special configuration. Use this method only if you know what you are doing.

USAGE
  $ celocli validator:update-bls-public-key

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsPop=0x                                        (required) BLS Proof-of-Possession
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address
  --globalHelp                                       View all available global flags

DESCRIPTION

  Regular (ECDSA and BLS) key rotation is recommended for Validator operational
  security.

  WARNING: By default, the BLS key used by the validator node is derived from the ECDSA
  private key. As a result, rotating the BLS key without rotating the ECDSA key will
  result in validator downtime without special configuration. Use this method only if
  you know what you are doing.

EXAMPLE
  update-bls-key --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde1115
  4f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be
  3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35
  664ea3923900
```

_See code:_ [_src/commands/validator/update-bls-public-key.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/update-bls-public-key.ts)

