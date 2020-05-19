---
description: Show rewards information about a voter, registered Validator, or Validator Group
---

## Commands

### Show

Show rewards information about a voter, registered Validator, or Validator Group

```
USAGE
  $ celocli rewards:show

OPTIONS
  --epochs=epochs                                         [default: 1] Show results for the last N epochs
  --estimate                                              Estimate voter rewards from current votes
  --group=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Validator Group to show rewards for
  --slashing                                              Show rewards for slashing
  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Validator to show rewards for
  --voter=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Voter to show rewards for

EXAMPLE
  show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/rewards/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/rewards/show.ts)_
