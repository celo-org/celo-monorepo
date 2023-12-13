# `celocli lockedgold`

View and manage locked CELO


## `celocli lockedgold:delegate`

Delegate locked celo.

```
Delegate locked celo.

USAGE
  $ celocli lockedgold:delegate

OPTIONS
  --from=from        (required)
  --globalHelp       View all available global flags
  --percent=percent  (required) 1-100% of locked celo to be delegated
  --to=to            (required)

EXAMPLE
  delegate --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --to
  0xc0ffee254729296a45a3885639AC7E10F9d54979 --percent 100
```

_See code: [src/commands/lockedgold/delegate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/delegate.ts)_

## `celocli lockedgold:delegate-info`

Delegate info about account.

```
Delegate info about account.

USAGE
  $ celocli lockedgold:delegate-info

OPTIONS
  --account=account  (required)
  --globalHelp       View all available global flags

EXAMPLE
  delegate-info --account 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [src/commands/lockedgold/delegate-info.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/delegate-info.ts)_

## `celocli lockedgold:lock`

Locks CELO to be used in governance and validator elections.

```
Locks CELO to be used in governance and validator elections.

USAGE
  $ celocli lockedgold:lock

OPTIONS
  --from=from    (required)
  --globalHelp   View all available global flags
  --value=value  (required) The unit amount of CELO

EXAMPLE
  lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 10000000000000000000000
```

_See code: [src/commands/lockedgold/lock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/lock.ts)_

## `celocli lockedgold:max-delegatees-count`

Returns the maximum number of delegates allowed per account.

```
Returns the maximum number of delegates allowed per account.

USAGE
  $ celocli lockedgold:max-delegatees-count

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  max-delegatees-count
```

_See code: [src/commands/lockedgold/max-delegatees-count.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/max-delegatees-count.ts)_

## `celocli lockedgold:revoke-delegate`

Revoke delegated locked celo.

```
Revoke delegated locked celo.

USAGE
  $ celocli lockedgold:revoke-delegate

OPTIONS
  --from=from        (required)
  --globalHelp       View all available global flags

  --percent=percent  (required) 1-100% of locked celo to be revoked from currently
                     delegated amount

  --to=to            (required)

EXAMPLE
  revoke-delegate --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --to
  0xc0ffee254729296a45a3885639AC7E10F9d54979 --percent 100
```

_See code: [src/commands/lockedgold/revoke-delegate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/revoke-delegate.ts)_

## `celocli lockedgold:show ACCOUNT`

Show Locked Gold information for a given account. This includes the total amount of locked celo, the amount being used for voting in Validator Elections, the Locked Gold balance this account is required to maintain due to a registered Validator or Validator Group, and any pending withdrawals that have been initiated via "lockedgold:unlock".

```
Show Locked Gold information for a given account. This includes the total amount of locked celo, the amount being used for voting in Validator Elections, the Locked Gold balance this account is required to maintain due to a registered Validator or Validator Group, and any pending withdrawals that have been initiated via "lockedgold:unlock".

USAGE
  $ celocli lockedgold:show ACCOUNT

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [src/commands/lockedgold/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/show.ts)_

## `celocli lockedgold:unlock`

Unlocks CELO, which can be withdrawn after the unlocking period. Unlocked celo will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".

```
Unlocks CELO, which can be withdrawn after the unlocking period. Unlocked celo will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".

USAGE
  $ celocli lockedgold:unlock

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                       View all available global flags
  --value=value                                      (required) The unit amount of CELO

EXAMPLE
  unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000
```

_See code: [src/commands/lockedgold/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/unlock.ts)_

## `celocli lockedgold:update-delegated-amount`

Updates the amount of delegated locked celo. There might be discrepancy between the amount of locked celo and the amount of delegated locked celo because of received rewards.

```
Updates the amount of delegated locked celo. There might be discrepancy between the amount of locked celo and the amount of delegated locked celo because of received rewards.

USAGE
  $ celocli lockedgold:update-delegated-amount

OPTIONS
  --from=from   (required)
  --globalHelp  View all available global flags
  --to=to       (required)

EXAMPLE
  update-delegated-amount --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --to
  0xc0ffee254729296a45a3885639AC7E10F9d54979
```

_See code: [src/commands/lockedgold/update-delegated-amount.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/update-delegated-amount.ts)_

## `celocli lockedgold:withdraw`

Withdraw any pending withdrawals created via "lockedgold:unlock" that have become available.

```
Withdraw any pending withdrawals created via "lockedgold:unlock" that have become available.

USAGE
  $ celocli lockedgold:withdraw

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                       View all available global flags

EXAMPLE
  withdraw --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [src/commands/lockedgold/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/withdraw.ts)_
