---
description: Manage your account, send and receive Celo Gold and Celo Dollars
---

## Commands

### Balance

View Celo Dollar and Gold balances given account address

```
USAGE
  $ celocli account:balance ACCOUNT

EXAMPLE
  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/lib/commands/account/balance.js](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/lib/commands/account/balance.js)_

### New

Creates a new account

```
USAGE
  $ celocli account:new

EXAMPLE
  new
```

_See code: [packages/cli/lib/commands/account/new.js](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/lib/commands/account/new.js)_

### Transferdollar

Transfer Celo Dollars

```
USAGE
  $ celocli account:transferdollar

OPTIONS
  --amountInWei=amountInWei                          (required) Amount to transfer (in wei)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

EXAMPLE
  transferdollar --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --amountInWei 1
```

_See code: [packages/cli/lib/commands/account/transferdollar.js](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/lib/commands/account/transferdollar.js)_

### Transfergold

Transfer gold

```
USAGE
  $ celocli account:transfergold

OPTIONS
  --amountInWei=amountInWei                          (required) Amount to transfer (in wei)
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

EXAMPLE
  transfergold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --amountInWei 1
```

_See code: [packages/cli/lib/commands/account/transfergold.js](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/lib/commands/account/transfergold.js)_

### Unlock

Unlock an account address to send transactions or validate blocks

```
USAGE
  $ celocli account:unlock

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --password=password                                   (required)

EXAMPLE
  unlock --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --password 1234
```

_See code: [packages/cli/lib/commands/account/unlock.js](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/lib/commands/account/unlock.js)_
