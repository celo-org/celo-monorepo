# `celocli bonds`

Manage bonded deposits to participate in governance and earn rewards

- [`celocli bonds:deposit`](#celocli-bondsdeposit)
- [`celocli bonds:list ACCOUNT`](#celocli-bondslist-account)
- [`celocli bonds:notify`](#celocli-bondsnotify)
- [`celocli bonds:register`](#celocli-bondsregister)
- [`celocli bonds:rewards`](#celocli-bondsrewards)
- [`celocli bonds:show ACCOUNT`](#celocli-bondsshow-account)
- [`celocli bonds:withdraw AVAILABILITYTIME`](#celocli-bondswithdraw-availabilitytime)

## `celocli bonds:deposit`

Create a bonded deposit given notice period and gold amount

```
USAGE
  $ celocli bonds:deposit

OPTIONS
  -h, --help                   show CLI help
  -l, --logLevel=logLevel
  --from=from                  (required)
  --goldAmount=goldAmount      (required) unit amount of gold token (cGLD)

  --noticePeriod=noticePeriod  (required) duration (seconds) from notice to withdrawable; doubles as ID of a bonded
                               deposit;

EXAMPLE
  deposit --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --noticePeriod 8640 --goldAmount 1000000000000000000
```

_See code: [src/commands/bonds/deposit.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/deposit.ts)_

## `celocli bonds:list ACCOUNT`

View information about all of the account's deposits

```
USAGE
  $ celocli bonds:list ACCOUNT

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  list 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [src/commands/bonds/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/list.ts)_

## `celocli bonds:notify`

Notify a bonded deposit given notice period and gold amount

```
USAGE
  $ celocli bonds:notify

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --goldAmount=goldAmount                            (required) unit amount of gold token (cGLD)

  --noticePeriod=noticePeriod                        (required) duration (seconds) from notice to withdrawable; doubles
                                                     as ID of a bonded deposit;

EXAMPLE
  notify --noticePeriod=3600 --goldAmount=500
```

_See code: [src/commands/bonds/notify.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/notify.ts)_

## `celocli bonds:register`

Register an account for bonded deposit eligibility

```
USAGE
  $ celocli bonds:register

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  register
```

_See code: [src/commands/bonds/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/register.ts)_

## `celocli bonds:rewards`

Manage rewards for bonded deposit account

```
USAGE
  $ celocli bonds:rewards

OPTIONS
  -d, --delegate=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Delegate rewards to provided account
  -h, --help                                                 show CLI help
  -l, --logLevel=logLevel
  -r, --redeem                                               Redeem accrued rewards from bonded deposits
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d          (required) Account Address

EXAMPLES
  rewards --redeem
  rewards --delegate=0x56e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [src/commands/bonds/rewards.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/rewards.ts)_

## `celocli bonds:show ACCOUNT`

View bonded gold and corresponding account weight of a deposit given ID

```
USAGE
  $ celocli bonds:show ACCOUNT

OPTIONS
  -h, --help                           show CLI help
  -l, --logLevel=logLevel
  --availabilityTime=availabilityTime  unix timestamp at which withdrawable; doubles as ID of a notified deposit

  --noticePeriod=noticePeriod          duration (seconds) from notice to withdrawable; doubles as ID of a bonded
                                       deposit;

EXAMPLES
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --noticePeriod=3600
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --availabilityTime=1562206887
```

_See code: [src/commands/bonds/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/show.ts)_

## `celocli bonds:withdraw AVAILABILITYTIME`

Withdraw notified deposit given availability time

```
USAGE
  $ celocli bonds:withdraw AVAILABILITYTIME

ARGUMENTS
  AVAILABILITYTIME  unix timestamp at which withdrawable; doubles as ID of a notified deposit

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  withdraw 3600
```

_See code: [src/commands/bonds/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/bonds/withdraw.ts)_
