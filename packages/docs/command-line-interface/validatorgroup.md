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

Deregister a Validator Group. Approximately 60 days after deregistration, the 10,000 Gold locked up to register the Validator Group will become possible to unlock. Note that the Group must be empty (i.e. no members) before deregistering.

```
USAGE
  $ celocli validatorgroup:deregister

OPTIONS
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
