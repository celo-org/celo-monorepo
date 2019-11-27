---
description: Manage your account, keys, and metadata
---

## Commands

### Authorize

Keep your locked Gold more secure by authorizing alternative keys to be used for signing attestations, voting, or validating. By doing so, you can continue to participate in the protocol why keeping the key with access to your locked Gold in cold storage. You must include a "proof-of-possession" of the key being authorized, which can be generated with the "account:proof-of-possession" command.

```
USAGE
  $ celocli account:authorize

OPTIONS
  -r, --role=vote|validator|attestation                (required) Role to delegate
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account Address
  --pop=pop                                            (required) Proof-of-possession of the signer key
  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLE
  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --pop
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb
```

_See code: [packages/cli/src/commands/account/authorize.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/authorize.ts)_

### Balance

View Celo Dollar and Gold balances for an address

```
USAGE
  $ celocli account:balance ADDRESS

EXAMPLE
  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/balance.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/balance.ts)_

### Claim-account

Claim another account in a local metadata file

```
USAGE
  $ celocli account:claim-account FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --address=address                                  (required) The address of the account you want to claim
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for

  --publicKey=publicKey                              The public key of the account if you want others to encrypt
                                                     messages to you

EXAMPLE
  claim-account ~/metadata.json --address test.com --from 0x0
```

_See code: [packages/cli/src/commands/account/claim-account.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-account.ts)_

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

### New

Creates a new account

```
USAGE
  $ celocli account:new

EXAMPLE
  new
```

_See code: [packages/cli/src/commands/account/new.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/new.ts)_

### Proof-of-possession

Generate proof-of-possession to be used to authorize a signer. See the "account:authorize" command for more details.

```
USAGE
  $ celocli account:proof-of-possession

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account that needs to proove
                                                        possession of the signer key.

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the signer key to prove possession of.

EXAMPLE
  proof-of-possession --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb
```

_See code: [packages/cli/src/commands/account/proof-of-possession.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/proof-of-possession.ts)_

### Register

Register an account on-chain. This allows you to lock Gold, which is a pre-requisite for registering a Validator or Group, participating in Validator elections and on-chain Governance, and earning epoch rewards.

```
USAGE
  $ celocli account:register

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --name=name

EXAMPLES
  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
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

### Set-name

Sets the name of a registered account on-chain. An account's name is an optional human readable identifier

```
USAGE
  $ celocli account:set-name

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --name=name                                           (required)

EXAMPLE
  register --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
```

_See code: [packages/cli/src/commands/account/set-name.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/set-name.ts)_

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

### Unlock

Unlock an account address to send transactions or validate blocks

```
USAGE
  $ celocli account:unlock

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --password=password

EXAMPLE
  unlock --account 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/unlock.ts)_
