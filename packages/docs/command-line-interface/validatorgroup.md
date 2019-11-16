---
description: View and manage validator groups
---

## Commands

### Commission

Update the commission for an existing validator group

```
USAGE
  $ celocli validatorgroup:commission

OPTIONS
  --commission=commission                            (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group

EXAMPLE
  commission --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1
```

_See code: [packages/cli/src/commands/validatorgroup/commission.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/commission.ts)_

### Deregister

Deregister a ValidatorGroup

```
USAGE
  $ celocli validatorgroup:deregister

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or ValidatorGroup's address

EXAMPLE
  deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validatorgroup/deregister.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/deregister.ts)_

### List

List existing Validator Groups

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
  --remove                                           Remove a validator from the members list
  --reorder=reorder                                  Reorder a validator within the members list

EXAMPLES
  member --accept 0x97f7333c51897469e8d98e7af8653aab468050a3
  member --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
  member --reorder 3 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validatorgroup/member.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/member.ts)_

### Register

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:register

OPTIONS
  --commission=commission                            (required)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --commission 0.1
```

_See code: [packages/cli/src/commands/validatorgroup/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/register.ts)_

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
