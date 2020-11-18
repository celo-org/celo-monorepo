---
description: View and manage Validator Groups
---

## Commands

### Commission

Manage the commission for a registered Validator Group. This represents the share of the epoch rewards given to elected Validators that goes to the group they are a member of. Updates must be made in a two step process where the group owner first calls uses the queue-update option, then after the required update delay, the apply option. The commission update delay, in blocks, can be viewed with the network:parameters command. A groups next commission update block can be checked with validatorgroup:show

```
USAGE
  $ celocli validatorgroup:commission

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with

  --apply                                            Applies a previously queued update. Should be called after the
                                                     update delay.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group or Validator Group
                                                     validator signer

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --queue-update=queue-update                        Queues an update to the commission, which can be applied after the
                                                     update delay.

  --useLedger                                        Set it to use a ledger wallet

EXAMPLES
  commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --queue-update 0.1
  commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --apply
```

_See code: [packages/cli/src/commands/validatorgroup/commission.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/commission.ts)_

### Deregister

Deregister a Validator Group. Approximately 180 days after the validator group is empty, it will be possible to deregister it start unlocking the CELO. If you wish to deregister your validator group, you must first remove all members, then wait the required 180 days before running this command.

```
USAGE
  $ celocli validatorgroup:deregister

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or ValidatorGroup's address

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

_See code: [packages/cli/src/commands/validatorgroup/deregister.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/deregister.ts)_

### List

List registered Validator Groups, their names (if provided), commission, and members.

```
USAGE
  $ celocli validatorgroup:list

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/validatorgroup/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/list.ts)_

### Member

Add or remove members from a Validator Group

```
USAGE
  $ celocli validatorgroup:member VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --accept                                           Accept a validator whose affiliation is already set to the group
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) ValidatorGroup's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --remove                                           Remove a validator from the members list

  --reorder=reorder                                  Reorder a validator within the members list. Indices are 0 based

  --useLedger                                        Set it to use a ledger wallet

  --yes                                              Answer yes to prompt

EXAMPLES
  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --accept 0x97f7333c51897469e8d98e7af8653aab468050a3
  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --remove 0x97f7333c51897469e8d98e7af8653aab468050a3
  member --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 --reorder 3 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validatorgroup/member.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/member.ts)_

### Register

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:register

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with

  --commission=commission                            (required) The share of the epoch rewards given to elected
                                                     Validators that goes to the group.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group

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
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1
```

_See code: [packages/cli/src/commands/validatorgroup/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/register.ts)_

### Reset-slashing-multiplier

Reset validator group slashing multiplier.

```
USAGE
  $ celocli validatorgroup:reset-slashing-multiplier GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  -k, --privateKey=privateKey                    Use a private key to sign local transactions with

  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  reset-slashing-multiplier 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/validatorgroup/reset-slashing-multiplier.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/reset-slashing-multiplier.ts)_

### Show

Show information about an existing Validator Group

```
USAGE
  $ celocli validatorgroup:show GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/validatorgroup/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/show.ts)_
