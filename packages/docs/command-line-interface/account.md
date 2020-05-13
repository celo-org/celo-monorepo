---
description: Manage your account, keys, and metadata
---

## Commands

### Authorize

Keep your locked Gold more secure by authorizing alternative keys to be used for signing attestations, voting, or validating. By doing so, you can continue to participate in the protocol while keeping the key with access to your locked Gold in cold storage. You must include a "proof-of-possession" of the key being authorized, which can be generated with the "account:proof-of-possession" command.

```
USAGE
  $ celocli account:authorize

OPTIONS
  -r, --role=vote|validator|attestation                (required) Role to delegate

  --blsKey=0x                                          The BLS public key that the validator is using for consensus,
                                                       should pass proof of possession. 96 bytes.

  --blsPop=0x                                          The BLS public key proof-of-possession, which consists of a
                                                       signature on the account address. 48 bytes.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account Address

  --ledgerAddresses=ledgerAddresses                    [default: 1] If --useLedger is set, this will get the first N
                                                       addresses for local signing

  --ledgerConfirmAddress                               Set it to ask confirmation for the address of the transaction
                                                       from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses        [default: [0]] If --useLedger is set, this will get the array of
                                                       index addresses for local signing. Example
                                                       --ledgerCustomAddresses "[4,99]"

  --signature=0x                                       (required) Signature (a.k.a proof-of-possession) of the signer
                                                       key

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

  --useLedger                                          Set it to use a ledger wallet

EXAMPLES
  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb
  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4
  db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900
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

Claim another account, and optionally its public key, and add the claim to a local metadata file

```
USAGE
  $ celocli account:claim-account FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --address=address                                  (required) The address of the account you want to claim

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --publicKey=publicKey                              The public key of the account that others may use to send you
                                                     encrypted messages

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  claim-account ~/metadata.json --address 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/account/claim-account.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-account.ts)_

### Claim-attestation-service-url

Claim the URL of the attestation service and add the claim to a local metadata file

```
USAGE
  $ celocli account:claim-attestation-service-url FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --url=https://www.celo.org                         (required) The url you want to claim

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  claim-attestation-service-url ~/metadata.json --url http://test.com/myurl --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/account/claim-attestation-service-url.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-attestation-service-url.ts)_

### Claim-domain

Claim a domain and add the claim to a local metadata file

```
USAGE
  $ celocli account:claim-domain FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --domain=domain                                    (required) The domain you want to claim

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  claim-domain ~/metadata.json --domain test.com --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/account/claim-domain.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-domain.ts)_

### Claim-keybase

Claim a keybase username and add the claim to a local metadata file

```
USAGE
  $ celocli account:claim-keybase FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --username=username                                (required) The keybase username you want to claim

EXAMPLE
  claim-keybase ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --username myusername
```

_See code: [packages/cli/src/commands/account/claim-keybase.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-keybase.ts)_

### Claim-name

Claim a name and add the claim to a local metadata file

```
USAGE
  $ celocli account:claim-name FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --name=name                                        (required) The name you want to claim

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  claim-name ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --name myname
```

_See code: [packages/cli/src/commands/account/claim-name.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-name.ts)_

### Create-metadata

Create an empty identity metadata file. Use this metadata file to store claims attesting to ownership of off-chain resources. Claims can be generated with the account:claim-\* commands.

```
USAGE
  $ celocli account:create-metadata FILE

ARGUMENTS
  FILE  Path where the metadata should be saved

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account to set metadata for or an
                                                     authorized signer for the address in the metadata

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  create-metadata ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/account/create-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/create-metadata.ts)_

### Get-metadata

Show information about an address. Retreives the metadata URL for an account from the on-chain, then fetches the metadata file off-chain and verifies proofs as able.

```
USAGE
  $ celocli account:get-metadata ADDRESS

ARGUMENTS
  ADDRESS  Address to get metadata for

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  get-metadata 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/account/get-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/get-metadata.ts)_

### List

List the addresses from the node and the local instance

```
USAGE
  $ celocli account:list

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet
```

_See code: [packages/cli/src/commands/account/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/list.ts)_

### Lock

Lock an account which was previously unlocked

```
USAGE
  $ celocli account:lock ACCOUNT

ARGUMENTS
  ACCOUNT  Account address

EXAMPLE
  lock 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/lock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/lock.ts)_

### New

Creates a new account locally using the Celo Derivation Path (m/44'/52752'/0/0/indexAddress) and print out the key information. Save this information for local transaction signing or import into a Celo node. Ledger: this command has been tested swapping mnemonics with the Ledger successfully (only supports english)

```
USAGE
  $ celocli account:new

OPTIONS
  --indexAddress=indexAddress
      Choose the index address of the derivation path

  --language=chinese_simplified|chinese_traditional|english|french|italian|japanese|korean|spanish
      [default: english] Language for the mnemonic words. **WARNING**, some hardware wallets don't support other languages

  --password=password
      Choose a password to generate the keys

EXAMPLES
  new
  new --password 12341234
  new --language spanish
  new --password 12341234 --language japanese --indexAddress 5
```

_See code: [packages/cli/src/commands/account/new.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/new.ts)_

### Proof-of-possession

Generate proof-of-possession to be used to authorize a signer. See the "account:authorize" command for more details.

```
USAGE
  $ celocli account:proof-of-possession

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account that needs to prove possession
                                                        of the signer key.

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the signer key to prove possession of.

  --useLedger                                           Set it to use a ledger wallet

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

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --name=name

  --useLedger                                        Set it to use a ledger wallet

EXAMPLES
  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
```

_See code: [packages/cli/src/commands/account/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register.ts)_

### Register-metadata

Register metadata URL for an account where users will be able to retieve the metadata file and verify your claims

```
USAGE
  $ celocli account:register-metadata

OPTIONS
  --force                                            Ignore metadata validity checks
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --url=https://www.celo.org                         (required) The url to the metadata you want to register

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  register-metadata --url https://www.mywebsite.com/celo-metadata --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/account/register-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register-metadata.ts)_

### Set-name

Sets the name of a registered account on-chain. An account's name is an optional human readable identifier

```
USAGE
  $ celocli account:set-name

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --name=name                                           (required)

  --useLedger                                           Set it to use a ledger wallet

EXAMPLE
  set-name --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
```

_See code: [packages/cli/src/commands/account/set-name.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/set-name.ts)_

### Show

Show information for an account, including name, authorized vote, validator, and attestation signers, the URL at which account metadata is hosted, the address the account is using with the mobile wallet, and a public key that can be used to encrypt information for the account.

```
USAGE
  $ celocli account:show ADDRESS

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show.ts)_

### Show-claimed-accounts

Show information about claimed accounts

```
USAGE
  $ celocli account:show-claimed-accounts ADDRESS

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  show-claimed-accounts 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/account/show-claimed-accounts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show-claimed-accounts.ts)_

### Show-metadata

Show the data in a local metadata file

```
USAGE
  $ celocli account:show-metadata FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  show-metadata ~/metadata.json
```

_See code: [packages/cli/src/commands/account/show-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show-metadata.ts)_

### Unlock

Unlock an account address to send transactions or validate blocks

```
USAGE
  $ celocli account:unlock ACCOUNT

ARGUMENTS
  ACCOUNT  Account address

OPTIONS
  --duration=duration  Duration in seconds to leave the account unlocked. Unlocks until the node exits by default.
  --password=password  Password used to unlock the account. If not specified, you will be prompted for a password.

EXAMPLES
  unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631
  unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631 --duration 600
```

_See code: [packages/cli/src/commands/account/unlock.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/unlock.ts)_

### Verify-proof-of-possession

Verify a proof-of-possession. See the "account:proof-of-possession" command for more details.

```
USAGE
  $ celocli account:verify-proof-of-possession

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account that needs to prove possession
                                                        of the signer key.

  --ledgerAddresses=ledgerAddresses                     [default: 1] If --useLedger is set, this will get the first N
                                                        addresses for local signing

  --ledgerConfirmAddress                                Set it to ask confirmation for the address of the transaction
                                                        from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses         [default: [0]] If --useLedger is set, this will get the array of
                                                        index addresses for local signing. Example
                                                        --ledgerCustomAddresses "[4,99]"

  --signature=0x                                        (required) Signature (a.k.a. proof-of-possession) of the signer
                                                        key

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the signer key to verify proof of
                                                        possession.

  --useLedger                                           Set it to use a ledger wallet

EXAMPLE
  verify-proof-of-possession --account 0x199eDF79ABCa29A2Fa4014882d3C13dC191A5B58 --signer
  0x0EdeDF7B1287f07db348997663EeEb283D70aBE7 --signature
  0x1c5efaa1f7ca6484d49ccce76217e2fba0552c0b23462cff7ba646473bc2717ffc4ce45be89bd5be9b5d23305e87fc2896808467c4081d9524a8
  4c01b89ec91ca3
```

_See code: [packages/cli/src/commands/account/verify-proof-of-possession.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/verify-proof-of-possession.ts)_
