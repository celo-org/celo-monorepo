# celo-cli

Tool for transacting with the Celo protocol

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@celo/celocli.svg)](https://npmjs.org/package/celo-cli)
[![CircleCI](https://circleci.com/gh/celo-org/celo-monorepo/tree/master.svg?style=shield)](https://circleci.com/gh/celo-org/celo-monorepo/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/@celo/celocli.svg)](https://npmjs.org/package/celo-cli)
[![License](https://img.shields.io/npm/l/@celo/celocli.svg)](https://github.com/celo-org/celo-monorepo/blob/master/package.json)

<!-- toc -->

- [celo-cli](#celo-cli)
- [Usage](#usage)
- [Commands](#commands)
  <!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @celo/celocli
$ celocli COMMAND
running command...
$ celocli (-v|--version|version)
@celo/celocli/0.0.6 darwin-x64 node-v8.12.0
$ celocli --help [COMMAND]
USAGE
  $ celocli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`celocli account:balance ACCOUNT`](#celocli-accountbalance-account)
- [`celocli account:new`](#celocli-accountnew)
- [`celocli account:transferdollar`](#celocli-accounttransferdollar)
- [`celocli account:transfergold`](#celocli-accounttransfergold)
- [`celocli account:unlock`](#celocli-accountunlock)
- [`celocli bonds:deposit`](#celocli-bondsdeposit)
- [`celocli bonds:list ACCOUNT`](#celocli-bondslist-account)
- [`celocli bonds:notify`](#celocli-bondsnotify)
- [`celocli bonds:register`](#celocli-bondsregister)
- [`celocli bonds:rewards`](#celocli-bondsrewards)
- [`celocli bonds:show ACCOUNT`](#celocli-bondsshow-account)
- [`celocli bonds:withdraw AVAILABILITYTIME`](#celocli-bondswithdraw-availabilitytime)
- [`celocli config:get`](#celocli-configget)
- [`celocli config:set`](#celocli-configset)
- [`celocli exchange:list`](#celocli-exchangelist)
- [`celocli exchange:selldollar SELLAMOUNT MINBUYAMOUNT FROM`](#celocli-exchangeselldollar-sellamount-minbuyamount-from)
- [`celocli exchange:sellgold SELLAMOUNT MINBUYAMOUNT FROM`](#celocli-exchangesellgold-sellamount-minbuyamount-from)
- [`celocli help [COMMAND]`](#celocli-help-command)
- [`celocli node:accounts`](#celocli-nodeaccounts)
- [`celocli validator:affiliation`](#celocli-validatoraffiliation)
- [`celocli validator:list`](#celocli-validatorlist)
- [`celocli validator:register`](#celocli-validatorregister)
- [`celocli validator:show VALIDATORADDRESS`](#celocli-validatorshow-validatoraddress)
- [`celocli validatorgroup:list`](#celocli-validatorgrouplist)
- [`celocli validatorgroup:member VALIDATORADDRESS`](#celocli-validatorgroupmember-validatoraddress)
- [`celocli validatorgroup:register`](#celocli-validatorgroupregister)
- [`celocli validatorgroup:show GROUPADDRESS`](#celocli-validatorgroupshow-groupaddress)
- [`celocli validatorgroup:vote`](#celocli-validatorgroupvote)

## `celocli account:balance ACCOUNT`

View token balances given account address

```
USAGE
  $ celocli account:balance ACCOUNT

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [src/commands/account/balance.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/balance.ts)_

## `celocli account:new`

Creates a new account

```
USAGE
  $ celocli account:new

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  new
```

_See code: [src/commands/account/new.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/new.ts)_

## `celocli account:transferdollar`

Transfer dollar

```
USAGE
  $ celocli account:transferdollar

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --amountInWei=amountInWei                          (required) Amount to transfer (in wei)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

EXAMPLE
  transfer --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --amountInWei 1
```

_See code: [src/commands/account/transferdollar.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/transferdollar.ts)_

## `celocli account:transfergold`

Transfer gold

```
USAGE
  $ celocli account:transfergold

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --amountInWei=amountInWei                          (required) Amount to transfer (in wei)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

EXAMPLE
  transfer --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --amountInWei 1
```

_See code: [src/commands/account/transfergold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/transfergold.ts)_

## `celocli account:unlock`

Unlock an account address to send transactions

```
USAGE
  $ celocli account:unlock

OPTIONS
  -h, --help                                            show CLI help
  -l, --logLevel=logLevel
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --password=password                                   (required)

EXAMPLE
  unlock --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --password 1234
```

_See code: [src/commands/account/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/unlock.ts)_

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

## `celocli config:get`

Output network node configuration

```
USAGE
  $ celocli config:get

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
```

_See code: [src/commands/config/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)_

## `celocli config:set`

Configure running node information for propogating transactions to network

```
USAGE
  $ celocli config:set

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
  --node=node              (required) [default: ws://localhost:8546] Node URL
```

_See code: [src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_

## `celocli exchange:list`

List information about tokens on the exchange (all amounts in wei)

```
USAGE
  $ celocli exchange:list

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
  --amount=amount          [default: 1000000000000000000] Amount of sellToken (in wei) to report rates for

EXAMPLE
  list
```

_See code: [src/commands/exchange/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/list.ts)_

## `celocli exchange:selldollar SELLAMOUNT MINBUYAMOUNT FROM`

Sell Celo dollars for Celo gold on the exchange

```
USAGE
  $ celocli exchange:selldollar SELLAMOUNT MINBUYAMOUNT FROM

ARGUMENTS
  SELLAMOUNT    the amount of sellToken (in wei) to sell
  MINBUYAMOUNT  the minimum amount of buyToken (in wei) expected
  FROM

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  selldollar 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [src/commands/exchange/selldollar.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/selldollar.ts)_

## `celocli exchange:sellgold SELLAMOUNT MINBUYAMOUNT FROM`

Sell Celo gold for Celo dollars on the exchange

```
USAGE
  $ celocli exchange:sellgold SELLAMOUNT MINBUYAMOUNT FROM

ARGUMENTS
  SELLAMOUNT    the amount of sellToken (in wei) to sell
  MINBUYAMOUNT  the minimum amount of buyToken (in wei) expected
  FROM

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  sellgold 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [src/commands/exchange/sellgold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/sellgold.ts)_

## `celocli help [COMMAND]`

display help for celocli

```
USAGE
  $ celocli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `celocli node:accounts`

List node accounts

```
USAGE
  $ celocli node:accounts

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
```

_See code: [src/commands/node/accounts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/node/accounts.ts)_

## `celocli validator:affiliation`

Manage affiliation to a ValidatorGroup

```
USAGE
  $ celocli validator:affiliation

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address
  --set=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   set affiliation to given address
  --unset                                            clear affiliation field

EXAMPLES
  affiliation --set 0x97f7333c51897469e8d98e7af8653aab468050a3 --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
  affiliation --unset --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [src/commands/validator/affiliation.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/affiliation.ts)_

## `celocli validator:list`

List existing Validators

```
USAGE
  $ celocli validator:list

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  list
```

_See code: [src/commands/validator/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/list.ts)_

## `celocli validator:register`

Register a new Validator

```
USAGE
  $ celocli validator:register

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator
  --id=id                                            (required)
  --name=name                                        (required)
  --noticePeriod=noticePeriod                        (required) Notice Period for the Bonded deposit to use
  --publicKey=0x                                     (required) Public Key
  --url=url                                          (required)

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url
  "http://validator.com" --publicKey
  0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf
  997eda082ae1
```

_See code: [src/commands/validator/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)_

## `celocli validator:show VALIDATORADDRESS`

Show information about an existing Validator

```
USAGE
  $ celocli validator:show VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [src/commands/validator/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/show.ts)_

## `celocli validatorgroup:list`

List existing Validator Groups

```
USAGE
  $ celocli validatorgroup:list

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  list
```

_See code: [src/commands/validatorgroup/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/list.ts)_

## `celocli validatorgroup:member VALIDATORADDRESS`

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:member VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --accept                                           Accept a validatior whose affiliation is already set to the vgroup
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) ValidatorGroup's address
  --remove                                           Remove a validatior from the members list

EXAMPLES
  member --accept 0x97f7333c51897469e8d98e7af8653aab468050a3
  member --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [src/commands/validatorgroup/member.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/member.ts)_

## `celocli validatorgroup:register`

Register a new Validator Group

```
USAGE
  $ celocli validatorgroup:register

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator Group
  --id=id                                            (required)
  --name=name                                        (required)
  --noticePeriod=noticePeriod                        (required) Notice Period for the Bonded deposit to use
  --url=url                                          (required)

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url
  "http://vgroup.com"
```

_See code: [src/commands/validatorgroup/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/register.ts)_

## `celocli validatorgroup:show GROUPADDRESS`

Show information about an existing Validator Group

```
USAGE
  $ celocli validatorgroup:show GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [src/commands/validatorgroup/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/show.ts)_

## `celocli validatorgroup:vote`

Vote for a Validator Group

```
USAGE
  $ celocli validatorgroup:vote

OPTIONS
  -h, --help                                         show CLI help
  -l, --logLevel=logLevel
  --current                                          Show voter's current vote
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   Set vote for ValidatorGroup's address
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --revoke                                           Revoke voter's current vote

EXAMPLES
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --revoke
  vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --current
```

_See code: [src/commands/validatorgroup/vote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validatorgroup/vote.ts)_

<!-- commandsstop -->
