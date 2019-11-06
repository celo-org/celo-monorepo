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
  --value=value  (required) unit amount of Celo Gold (cGLD)

EXAMPLE
  lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 1000000000000000000
```

_See code: [packages/cli/src/commands/lockedgold/lock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/lock.ts)_

### Show

Show Locked Gold information for a given account

```
USAGE
  $ celocli lockedgold:show ACCOUNT

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/lockedgold/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/show.ts)_

### Unlock

Unlocks Celo Gold, which can be withdrawn after the unlocking period.

```
USAGE
  $ celocli lockedgold:unlock

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --value=value                                      (required) unit amount of Celo Gold (cGLD)

EXAMPLE
  unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000
```

_See code: [packages/cli/src/commands/lockedgold/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/unlock.ts)_

### Withdraw

Withdraw unlocked gold whose unlocking period has passed.

```
USAGE
  $ celocli lockedgold:withdraw

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  withdraw --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/lockedgold/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/withdraw.ts)_
