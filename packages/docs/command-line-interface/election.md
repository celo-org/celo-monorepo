---
description: View and manage validator elections
---

## Commands

### Current

Outputs the currently elected validator set

```
USAGE
  $ celocli election:current

EXAMPLE
  current
```

_See code: [packages/cli/src/commands/election/current.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/current.ts)_

### List

Outputs the validator groups and their vote totals

```
USAGE
  $ celocli election:list

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/election/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/list.ts)_

### Run

Runs an mock election and outputs the validators that were elected

```
USAGE
  $ celocli election:run

EXAMPLE
  run
```

_See code: [packages/cli/src/commands/election/run.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/run.ts)_

### Show

Show election information about an existing Validator Group

```
USAGE
  $ celocli election:show GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  Validator Groups's address

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/election/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/show.ts)_

### Vote

Vote for a Validator Group in validator elections.

```
USAGE
  $ celocli election:vote

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Set vote for ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --value=value                                      (required) Amount of Gold used to vote for group

EXAMPLE
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b, --value
  1000000
```

_See code: [packages/cli/src/commands/election/vote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/vote.ts)_
