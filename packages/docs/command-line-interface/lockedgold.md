---
description: Delegate validating, voting and reward roles for Locked Gold account
---

## Commands

### Delegate

Delegate validating, voting and reward roles for Locked Gold account

```
USAGE
  $ celocli lockedgold:delegate

OPTIONS
  -r, --role=Validating|Voting|Rewards               Role to delegate
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account Address

EXAMPLE
  delegate --from=0x5409ED021D9299bf6814279A6A1411A7e866A631 --role Voting
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/lockedgold/delegate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/delegate.ts)_

### List

View information about all of the account's commitments

```
USAGE
  $ celocli lockedgold:list ACCOUNT

EXAMPLE
  list 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/lockedgold/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/list.ts)_

### Lockup

Create a Locked Gold commitment given notice period and gold amount

```
USAGE
  $ celocli lockedgold:lockup

OPTIONS
  --from=from                  (required)
  --goldAmount=goldAmount      (required) unit amount of gold token (cGLD)

  --noticePeriod=noticePeriod  (required) duration (seconds) from notice to withdrawable; doubles as ID of a Locked Gold
                               commitment;

EXAMPLE
  lockup --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --noticePeriod 8640 --goldAmount 1000000000000000000
```

_See code: [packages/cli/src/commands/lockedgold/lockup.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/lockup.ts)_

### Notify

Notify a Locked Gold commitment given notice period and gold amount

```
USAGE
  $ celocli lockedgold:notify

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --goldAmount=goldAmount                            (required) unit amount of gold token (cGLD)

  --noticePeriod=noticePeriod                        (required) duration (seconds) from notice to withdrawable; doubles
                                                     as ID of a Locked Gold commitment;

EXAMPLE
  notify --noticePeriod=3600 --goldAmount=500
```

_See code: [packages/cli/src/commands/lockedgold/notify.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/notify.ts)_

### Register

Register an account for Locked Gold

```
USAGE
  $ celocli lockedgold:register

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  register
```

_See code: [packages/cli/src/commands/lockedgold/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/register.ts)_

### Rewards

Manage rewards for Locked Gold account

```
USAGE
  $ celocli lockedgold:rewards

OPTIONS
  -d, --delegate=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Delegate rewards to provided account
  -r, --redeem                                               Redeem accrued rewards from Locked Gold
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d          (required) Account Address

EXAMPLES
  rewards --redeem
  rewards --delegate=0x56e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/lockedgold/rewards.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/rewards.ts)_

### Show

Show Locked Gold and corresponding account weight of a commitment given ID

```
USAGE
  $ celocli lockedgold:show ACCOUNT

OPTIONS
  --availabilityTime=availabilityTime  unix timestamp at which withdrawable; doubles as ID of a notified commitment

  --noticePeriod=noticePeriod          duration (seconds) from notice to withdrawable; doubles as ID of a Locked Gold
                                       commitment;

EXAMPLES
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --noticePeriod=3600
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --availabilityTime=1562206887
```

_See code: [packages/cli/src/commands/lockedgold/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/show.ts)_

### Withdraw

Withdraw notified commitment given availability time

```
USAGE
  $ celocli lockedgold:withdraw AVAILABILITYTIME

ARGUMENTS
  AVAILABILITYTIME  unix timestamp at which withdrawable; doubles as ID of a notified commitment

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  withdraw 3600
```

_See code: [packages/cli/src/commands/lockedgold/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/lockedgold/withdraw.ts)_
