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
  --address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Address to filter
  --epochs=epochs                                       Number of epochs
  --no-truncate                                         Don't truncate fields to fit line

EXAMPLE
  show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/rewards/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/rewards/show.ts)_
