# Election

Participate in and view the state of Validator Elections

## `celocli election:activate`

Activate pending votes in validator elections to begin earning rewards. To earn rewards as a voter, it is required to activate your pending votes at some point after the end of the epoch in which they were made.

```text
Activate pending votes in validator elections to begin earning rewards. To earn rewards as a voter, it is required to activate your pending votes at some point after the end of the epoch in which they were made.

USAGE
  $ celocli election:activate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --globalHelp                                       View all available global flags

  --wait                                             Wait until all pending votes can be
                                                     activated

EXAMPLES
  activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1

  activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --wait
```

_See code:_ [_src/commands/election/activate.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/activate.ts)

## `celocli election:current`

Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.

```text
Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.

USAGE
  $ celocli election:current

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

  --valset                Show currently used signers from valset (by default the
                          authorized validator signers are shown). Useful for checking
                          if keys have been rotated.
```

_See code:_ [_src/commands/election/current.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/current.ts)

## `celocli election:list`

Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators.

```text
Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators.

USAGE
  $ celocli election:list

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

_See code:_ [_src/commands/election/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/list.ts)

## `celocli election:revoke`

Revoke votes for a Validator Group in validator elections.

```text
Revoke votes for a Validator Group in validator elections.

USAGE
  $ celocli election:revoke

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --globalHelp                                       View all available global flags
  --value=value                                      (required) Value of votes to revoke

EXAMPLE
  revoke --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for
  0x932fee04521f5fcb21949041bf161917da3f588b, --value 1000000
```

_See code:_ [_src/commands/election/revoke.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/revoke.ts)

## `celocli election:run`

Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.

```text
Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.

USAGE
  $ celocli election:run

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
```

_See code:_ [_src/commands/election/run.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/run.ts)

## `celocli election:show ADDRESS`

Show election information about a voter or registered Validator Group

```text
Show election information about a voter or registered Validator Group

USAGE
  $ celocli election:show ADDRESS

ARGUMENTS
  ADDRESS  Voter or Validator Groups's address

OPTIONS
  --globalHelp  View all available global flags
  --group       Show information about a group running in Validator elections
  --voter       Show information about an account voting in Validator elections

EXAMPLES
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --voter

  show 0x97f7333c51897469E8D98E7af8653aAb468050a3 --group
```

_See code:_ [_src/commands/election/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/show.ts)

## `celocli election:vote`

Vote for a Validator Group in validator elections.

```text
Vote for a Validator Group in validator elections.

USAGE
  $ celocli election:vote

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --globalHelp                                       View all available global flags

  --value=value                                      (required) Amount of Gold used to
                                                     vote for group

EXAMPLE
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for
  0x932fee04521f5fcb21949041bf161917da3f588b, --value 1000000
```

_See code:_ [_src/commands/election/vote.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/vote.ts)

