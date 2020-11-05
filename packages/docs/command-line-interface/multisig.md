---
description: Shows information about multi-sig contract
---

## Commands

### Show

Shows information about multi-sig contract

```
USAGE
  $ celocli multisig:show ADDRESS

OPTIONS
  --all    Show info about all transactions
  --raw    Do not attempt to parse transactions
  --tx=tx  Show info for a transaction

EXAMPLES
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --tx 3
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --all --raw
```

_See code: [packages/cli/src/commands/multisig/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/multisig/show.ts)_
