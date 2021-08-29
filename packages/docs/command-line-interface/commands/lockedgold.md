# LockedGold

View and manage locked CELO

## `celocli lockedgold:lock`

Locks CELO to be used in governance and validator elections.

```text
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

_See code:_ [_src/commands/lockedgold/lock.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/lock.ts)

## `celocli lockedgold:show ACCOUNT`

Show Locked Gold information for a given account. This includes the total amount of locked gold, the amount being used for voting in Validator Elections, the Locked Gold balance this account is required to maintain due to a registered Validator or Validator Group, and any pending withdrawals that have been initiated via "lockedgold:unlock".

```text
Show Locked Gold information for a given account. This includes the total amount of locked gold, the amount being used for voting in Validator Elections, the Locked Gold balance this account is required to maintain due to a registered Validator or Validator Group, and any pending withdrawals that have been initiated via "lockedgold:unlock".

USAGE
  $ celocli lockedgold:show ACCOUNT

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/lockedgold/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/show.ts)

## `celocli lockedgold:unlock`

Unlocks CELO, which can be withdrawn after the unlocking period. Unlocked gold will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".

```text
Unlocks CELO, which can be withdrawn after the unlocking period. Unlocked gold will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".

USAGE
  $ celocli lockedgold:unlock

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                       View all available global flags
  --value=value                                      (required) The unit amount of CELO

EXAMPLE
  unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000
```

_See code:_ [_src/commands/lockedgold/unlock.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/unlock.ts)

## `celocli lockedgold:withdraw`

Withdraw any pending withdrawals created via "lockedgold:unlock" that have become available.

```text
Withdraw any pending withdrawals created via "lockedgold:unlock" that have become available.

USAGE
  $ celocli lockedgold:withdraw

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                       View all available global flags

EXAMPLE
  withdraw --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/lockedgold/withdraw.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/withdraw.ts)

