# ValidatorGroup

View and manage Validator Groups

## `celocli validatorgroup:commission`

Manage the commission for a registered Validator Group. This represents the share of the epoch rewards given to elected Validators that goes to the group they are a member of. Updates must be made in a two step process where the group owner first calls uses the queue-update option, then after the required update delay, the apply option. The commission update delay, in blocks, can be viewed with the network:parameters command. A groups next commission update block can be checked with validatorgroup:show

```text
Manage the commission for a registered Validator Group. This represents the share of the epoch rewards given to elected Validators that goes to the group they are a member of. Updates must be made in a two step process where the group owner first calls uses the queue-update option, then after the required update delay, the apply option. The commission update delay, in blocks, can be viewed with the network:parameters command. A groups next commission update block can be checked with validatorgroup:show

USAGE
  $ celocli validatorgroup:commission

OPTIONS
  --apply                                            Applies a previously queued update.
                                                     Should be called after the update
                                                     delay.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the
                                                     Validator Group or Validator Group
                                                     validator signer

  --globalHelp                                       View all available global flags

  --queue-update=queue-update                        Queues an update to the commission,
                                                     which can be applied after the
                                                     update delay.

EXAMPLES
  commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --queue-update 0.1

  commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --apply
```

_See code:_ [_src/commands/validatorgroup/commission.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/commission.ts)

## `celocli validatorgroup:deregister`

Deregister a Validator Group. Approximately 180 days after the validator group is empty, it will be possible to deregister it start unlocking the CELO. If you wish to deregister your validator group, you must first remove all members, then wait the required 180 days before running this command.

```text
Deregister a Validator Group. Approximately 180 days after the validator group is empty, it will be possible to deregister it start unlocking the CELO. If you wish to deregister your validator group, you must first remove all members, then wait the required 180 days before running this command.

USAGE
  $ celocli validatorgroup:deregister

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or
                                                     ValidatorGroup's address

  --globalHelp                                       View all available global flags

EXAMPLE
  deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code:_ [_src/commands/validatorgroup/deregister.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/deregister.ts)

## `celocli validatorgroup:list`

List registered Validator Groups, their names \(if provided\), commission, and members.

```text
List registered Validator Groups, their names (if provided), commission, and members.

USAGE
  $ celocli validatorgroup:list

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

_See code:_ [_src/commands/validatorgroup/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/list.ts)

## `celocli validatorgroup:member VALIDATORADDRESS`

Add or remove members from a Validator Group

```text
Add or remove members from a Validator Group

USAGE
  $ celocli validatorgroup:member VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  --accept                                           Accept a validator whose
                                                     affiliation is already set to the
                                                     group

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) ValidatorGroup's address

  --globalHelp                                       View all available global flags

  --remove                                           Remove a validator from the members
                                                     list

  --reorder=reorder                                  Reorder a validator within the
                                                     members list. Indices are 0 based

  --yes                                              Answer yes to prompt

EXAMPLES
  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --accept
  0x97f7333c51897469e8d98e7af8653aab468050a3

  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --remove
  0x97f7333c51897469e8d98e7af8653aab468050a3

  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --reorder 3
  0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code:_ [_src/commands/validatorgroup/member.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/member.ts)

## `celocli validatorgroup:register`

Register a new Validator Group

```text
Register a new Validator Group

USAGE
  $ celocli validatorgroup:register

OPTIONS
  --commission=commission                            (required) The share of the epoch
                                                     rewards given to elected Validators
                                                     that goes to the group.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the
                                                     Validator Group

  --globalHelp                                       View all available global flags

  --yes                                              Answer yes to prompt

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1
```

_See code:_ [_src/commands/validatorgroup/register.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/register.ts)

## `celocli validatorgroup:reset-slashing-multiplier GROUPADDRESS`

Reset validator group slashing multiplier.

```text
Reset validator group slashing multiplier.

USAGE
  $ celocli validatorgroup:reset-slashing-multiplier GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  reset-slashing-multiplier 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code:_ [_src/commands/validatorgroup/reset-slashing-multiplier.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/reset-slashing-multiplier.ts)

## `celocli validatorgroup:show GROUPADDRESS`

Show information about an existing Validator Group

```text
Show information about an existing Validator Group

USAGE
  $ celocli validatorgroup:show GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code:_ [_src/commands/validatorgroup/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/show.ts)

