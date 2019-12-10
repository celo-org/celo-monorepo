---
description: View and manage locked Celo Gold
---

## Commands

### Lock

Locks Celo Gold to be used in governance and validator elections.

```
USAGE
  $ celocli lockedgold:lock

OPTIONS
  --from=from    (required)
  --value=value  (required) The unit amount of Celo Gold (cGLD)

EXAMPLE
  lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 10000000000000000000000
```

_See code: [packages/cli/src/commands/lockedgold/lock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/lock.ts)_

### Show

Show Locked Gold information for a given account. This includes the total amount of locked gold, the amount being used for voting in Validator Elections, the Locked Gold balance this account is required to maintain due to a registered Validator or Validator Group, and any pending withdrawals that have been initiated via "lockedgold:unlock".

```
USAGE
  $ celocli lockedgold:show ACCOUNT

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/lockedgold/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/show.ts)_

### Unlock

Unlocks Celo Gold, which can be withdrawn after the unlocking period. Unlocked gold will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".

```
USAGE
  $ celocli lockedgold:unlock

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --value=value                                      (required) The unit amount of Celo Gold (cGLD)

EXAMPLE
  unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000
```

_See code: [packages/cli/src/commands/lockedgold/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/unlock.ts)_

### Withdraw

Withdraw any pending withdrawals created via "lockedgold:unlock" that have become available.

```
USAGE
  $ celocli lockedgold:withdraw

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  withdraw --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/lockedgold/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/withdraw.ts)_
