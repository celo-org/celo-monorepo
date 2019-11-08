---
description: Manage your account, send and receive Celo Gold and Celo Dollars
---

## Commands

### Authorize

Authorize an attestation, validation or vote signing key

```
USAGE
  $ celocli account:authorize

OPTIONS
  -r, --role=vote|validation|attestation             Role to delegate
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account Address

EXAMPLE
  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --to
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/account/authorize.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/authorize.ts)_

### Balance

View Celo Dollar and Gold balances given account address

```
USAGE
  $ celocli account:balance ACCOUNT

EXAMPLE
  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/balance.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/balance.ts)_

### Claim-attestation-service-url

Claim the URL of the attestation service in a local metadata file

```
USAGE
  $ celocli account:claim-attestation-service-url FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for
  --url=htttps://www.celo.org                        (required) The url you want to claim

EXAMPLE
  claim-attestation-service-url ~/metadata.json --url http://test.com/myurl --from 0x0
```

_See code: [packages/cli/src/commands/account/claim-attestation-service-url.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-attestation-service-url.ts)_

### Claim-domain

Change the domain in a local metadata file

```
USAGE
  $ celocli account:claim-domain FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --domain=domain                                    (required) The domain you want to claim
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for

EXAMPLE
  claim-domain ~/metadata.json --domain test.com --from 0x0
```

_See code: [packages/cli/src/commands/account/claim-domain.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-domain.ts)_

### Claim-keybase

Claim a keybase username in a local metadata file

```
USAGE
  $ celocli account:claim-keybase FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for
  --username=username                                (required) The keybase username you want to claim

EXAMPLE
  claim-keybase ~/metadata.json --from 0x0 --username test
```

_See code: [packages/cli/src/commands/account/claim-keybase.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-keybase.ts)_

### Claim-name

Change the name in a local metadata file

```
USAGE
  $ celocli account:claim-name FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for
  --name=name                                        (required) The name you want to claim

EXAMPLE
  change-name ~/metadata.json --from 0x0 --name myname
```

_See code: [packages/cli/src/commands/account/claim-name.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-name.ts)_

### Create-metadata

Create an empty metadata file

```
USAGE
  $ celocli account:create-metadata FILE

ARGUMENTS
  FILE  Path where the metadata should be saved

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for

EXAMPLE
  create-metadata ~/metadata.json --from 0x0
```

_See code: [packages/cli/src/commands/account/create-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/create-metadata.ts)_

### Get-metadata

Show information about an address

```
USAGE
  $ celocli account:get-metadata ADDRESS

ARGUMENTS
  ADDRESS  Address to get metadata for

EXAMPLE
  get-metadata 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/account/get-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/get-metadata.ts)_

### Isvalidator

Check whether a given address is elected to be validating in the current epoch

```
USAGE
  $ celocli account:isvalidator ADDRESS

EXAMPLE
  isvalidator 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/isvalidator.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/isvalidator.ts)_

### Lock

Locks Celo Gold to be used in governance and validator elections.

```
USAGE
  $ celocli account:lock

OPTIONS
  --from=from    (required)
  --value=value  (required) unit amount of Celo Gold (cGLD)

EXAMPLE
  lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 1000000000000000000
```

_See code: [packages/cli/src/commands/account/lock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/lock.ts)_

### New

Creates a new account

```
USAGE
  $ celocli account:new

EXAMPLE
  new
```

_See code: [packages/cli/src/commands/account/new.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/new.ts)_

### Register

Register an account

```
USAGE
  $ celocli account:register

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --name=name                                        (required)

EXAMPLE
  register
```

_See code: [packages/cli/src/commands/account/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register.ts)_

### Register-metadata

Register metadata about an address

```
USAGE
  $ celocli account:register-metadata

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for
  --url=htttps://www.celo.org                        (required) The url to the metadata you want to register

EXAMPLE
  register-metadata --url https://www.celo.org --from 0x0
```

_See code: [packages/cli/src/commands/account/register-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register-metadata.ts)_

### Show-metadata

Show the data in a local metadata file

```
USAGE
  $ celocli account:show-metadata FILE

ARGUMENTS
  FILE  Path of the metadata file

EXAMPLE
  show-metadata ~/metadata.json
```

_See code: [packages/cli/src/commands/account/show-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show-metadata.ts)_

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

_See code: [packages/cli/src/commands/account/transferdollar.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/transferdollar.ts)_

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

_See code: [packages/cli/src/commands/account/transfergold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/transfergold.ts)_

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

_See code: [packages/cli/src/commands/account/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/unlock.ts)_
