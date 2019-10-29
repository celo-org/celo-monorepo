---
description: View and manage validator elections
---

## Commands

### Validatorset

Outputs the current validator set

```
USAGE
  $ celocli election:validatorset

EXAMPLE
  validatorset
```

_See code: [packages/cli/src/commands/election/validatorset.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/election/validatorset.ts)_

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
