---
description: Participate in and view the state of Validator Elections
---

# Election

## Activate

Activate pending votes in validator elections to begin earning rewards. To earn rewards as a voter, it is required to activate your pending votes at some point after the end of the epoch in which they were made.

```text
USAGE
  $ celocli election:activate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --wait                                             Wait until all pending votes can be activated

EXAMPLES
  activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1
  activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --wait
```

_See code:_ [_packages/cli/src/commands/election/activate.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/activate.ts)

## Current

Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.

```text
USAGE
  $ celocli election:current

OPTIONS
  --valset  Show currently used signers from valset (by default the authorized validator signers are shown). Useful for
            checking if keys have been rotated.
```

_See code:_ [_packages/cli/src/commands/election/current.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/current.ts)

## List

Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators.

```text
USAGE
  $ celocli election:list

EXAMPLE
  list
```

_See code:_ [_packages/cli/src/commands/election/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/list.ts)

## Revoke

Revoke votes for a Validator Group in validator elections.

```text
USAGE
  $ celocli election:revoke

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Value of votes to revoke

EXAMPLE
  revoke --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b, --value
  1000000
```

_See code:_ [_packages/cli/src/commands/election/revoke.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/revoke.ts)

## Run

Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.

```text
USAGE
  $ celocli election:run
```

_See code:_ [_packages/cli/src/commands/election/run.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/run.ts)

## Show

Show election information about a voter or registered Validator Group

```text
USAGE
  $ celocli election:show ADDRESS

ARGUMENTS
  ADDRESS  Voter or Validator Groups's address

OPTIONS
  --group  Show information about a group running in Validator elections
  --voter  Show information about an account voting in Validator elections

EXAMPLES
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --voter
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --group
```

_See code:_ [_packages/cli/src/commands/election/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/show.ts)

## Vote

Vote for a Validator Group in validator elections.

```text
USAGE
  $ celocli election:vote

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Amount of Gold used to vote for group

EXAMPLE
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b, --value
  1000000
```

_See code:_ [_packages/cli/src/commands/election/vote.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/vote.ts)

