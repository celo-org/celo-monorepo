---
description: View validator group information and cast votes
---

## Commands

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

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:member VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  --accept                                           Accept a validator whose affiliation is already set to the group
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) ValidatorGroup's address
  --remove                                           Remove a validator from the members list

EXAMPLES
  member --accept 0x97f7333c51897469e8d98e7af8653aab468050a3
  member --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validatorgroup/member.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/member.ts)_

### Register

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:register

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group
  --id=id                                            (required)
  --name=name                                        (required)

  --noticePeriod=noticePeriod                        (required) Notice period of the Locked Gold commitment. Specify
                                                     multiple notice periods to use the sum of the commitments.

  --url=url                                          (required)

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myName --noticePeriod 5184000
  --noticePeriod 5184001 --url "http://vgroup.com"
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

### Vote

Vote for a Validator Group

```
USAGE
  $ celocli validatorgroup:vote

OPTIONS
  --current                                          Show voter's current vote
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   Set vote for ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --revoke                                           Revoke voter's current vote

EXAMPLES
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --revoke
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --current
```

_See code: [packages/cli/src/commands/validatorgroup/vote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/vote.ts)_
