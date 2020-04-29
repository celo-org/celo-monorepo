---
description: View and manage Release Gold contracts
---

## Commands

### Authorize

Authorize an alternative key to be used for a given action (Vote, Validate, Attest) on behalf of the ReleaseGold instance contract.

```
USAGE
  $ celocli releasegold:authorize

OPTIONS
  --blsKey=0x                                            The BLS public key that the validator is using for consensus,
                                                         should pass proof of possession. 96 bytes.

  --blsPop=0x                                            The BLS public key proof-of-possession, which consists of a
                                                         signature on the account address. 48 bytes.

  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --role=vote|validator|attestation                      (required)

  --signature=0x                                         (required) Signature (a.k.a. proof-of-possession) of the signer
                                                         key

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) The signer key that is to be used for voting through
                                                         the ReleaseGold instance

  --useLedger                                            Set it to use a ledger wallet

EXAMPLES
  authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb
  authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role validator --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb
  authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role attestation --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d
  1a1eebad8452eb
```

_See code: [packages/cli/src/commands/releasegold/authorize.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/authorize.ts)_

### Create-account

Creates a new account for the ReleaseGold instance

```
USAGE
  $ celocli releasegold:create-account

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

EXAMPLE
  create-account --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code: [packages/cli/src/commands/releasegold/create-account.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/create-account.ts)_

### Locked-gold

Perform actions [lock, unlock, withdraw] on Celo Gold that has been locked via the provided ReleaseGold contract.

```
USAGE
  $ celocli releasegold:locked-gold

OPTIONS
  -a, --action=lock|unlock|withdraw                      (required) Action to perform on contract's gold
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --value=10000000000000000000000                        (required) Amount of gold to perform `action` with

  --yes                                                  Answer yes to prompt

EXAMPLES
  locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action lock --value 10000000000000000000000
  locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action unlock --value 10000000000000000000000
  locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action withdraw --value 10000000000000000000000
```

_See code: [packages/cli/src/commands/releasegold/locked-gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/locked-gold.ts)_

### Refund-and-finalize

Refund the given contract's balance to the appopriate parties and destroy the contact. Can only be called by the release owner of revocable ReleaseGold instances.

```
USAGE
  $ celocli releasegold:refund-and-finalize

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

EXAMPLE
  refund-and-finalize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code: [packages/cli/src/commands/releasegold/refund-and-finalize.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/refund-and-finalize.ts)_

### Release-gold

```
USAGE
  $ celocli releasegold:release-gold

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet
```

_See code: [packages/cli/src/commands/releasegold/release-gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/release-gold.ts)_

### Revoke

Revoke the given contract instance. Once revoked, any Locked Gold can be unlocked by the release owner. The beneficiary will then be able to withdraw any released Gold that had yet to be withdrawn, and the remainder can be transferred by the release owner to the refund address. Note that not all ReleaseGold instances are revokable.

```
USAGE
  $ celocli releasegold:revoke

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --yesreally                                            Override prompt to set liquidity (be careful!)

EXAMPLE
  revoke --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code: [packages/cli/src/commands/releasegold/revoke.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/revoke.ts)_

### Revoke-votes

Revokes `votes` for the given contract's account from the given group's account

```
USAGE
  $ celocli releasegold:revoke-votes

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract
  --group=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the group to revoke votes from

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --votes=votes                                          (required) The number of votes to revoke

EXAMPLE
  revoke-votes --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --group 0x5409ED021D9299bf6814279A6A1411A7e866A631
  --votes 100
```

_See code: [packages/cli/src/commands/releasegold/revoke-votes.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/revoke-votes.ts)_

### Set-account

Set account properties of the ReleaseGold instance account such as name, data encryption key, and the metadata URL

```
USAGE
  $ celocli releasegold:set-account

OPTIONS
  -p, --property=name|dataEncryptionKey|metaURL          (required) Property type to set
  -v, --value=value                                      (required) Property value to set
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

EXAMPLES
  set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property name --value mywallet
  set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property dataEncryptionKey --value
  0x041bb96e35f9f4b71ca8de561fff55a249ddf9d13ab582bdd09a09e75da68ae4cd0ab7038030f41b237498b4d76387ae878dc8d98fd6f6db2c15
  362d1a3bf11216
  set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property metaURL --value www.test.com
```

_See code: [packages/cli/src/commands/releasegold/set-account.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-account.ts)_

### Set-account-wallet-address

Set the ReleaseGold contract account's wallet address

```
USAGE
  $ celocli releasegold:set-account-wallet-address

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d       (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                           [default: 1] If --useLedger is set, this will get the
                                                              first N addresses for local signing

  --ledgerConfirmAddress                                      Set it to ask confirmation for the address of the
                                                              transaction from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses               [default: [0]] If --useLedger is set, this will get the
                                                              array of index addresses for local signing. Example
                                                              --ledgerCustomAddresses "[4,99]"

  --pop=pop                                                   ECDSA PoP for signer over contract's account

  --useLedger                                                 Set it to use a ledger wallet

  --walletAddress=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of wallet to set for contract's account
                                                              and signer of PoP. 0x0 if owner wants payers to contact
                                                              them directly.

EXAMPLE
  set-account-wallet-address --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --walletAddress
  0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84 --pop
  0x1b3e611d05e46753c43444cdc55c2cc3d95c54da0eba2464a8cc8cb01bd57ae8bb3d82a0e293ca97e5813e7fb9b624127f42ef0871d025d8a56f
  e2f8f08117e25b
```

_See code: [packages/cli/src/commands/releasegold/set-account-wallet-address.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-account-wallet-address.ts)_

### Set-beneficiary

Set the beneficiary of the ReleaseGold contract. This command is gated via a multi-sig, so this is expected to be called twice: once by the contract's beneficiary and once by the contract's releaseOwner. Once both addresses call this command with the same parameters, the tx will execute.

```
USAGE
  $ celocli releasegold:set-beneficiary

OPTIONS
  --beneficiary=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the new beneficiary
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d     (required) Address of the ReleaseGold Contract

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d         (required) Address to submit multisig transaction from (one
                                                            of the owners)

  --ledgerAddresses=ledgerAddresses                         [default: 1] If --useLedger is set, this will get the first
                                                            N addresses for local signing

  --ledgerConfirmAddress                                    Set it to ask confirmation for the address of the
                                                            transaction from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses             [default: [0]] If --useLedger is set, this will get the
                                                            array of index addresses for local signing. Example
                                                            --ledgerCustomAddresses "[4,99]"

  --useLedger                                               Set it to use a ledger wallet

  --yesreally                                               Override prompt to set new beneficiary (be careful!)

EXAMPLE
  set-beneficiary --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --from
  0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84 --beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb
```

_See code: [packages/cli/src/commands/releasegold/set-beneficiary.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-beneficiary.ts)_

### Set-can-expire

Set the canExpire flag for the given ReleaseGold contract

```
USAGE
  $ celocli releasegold:set-can-expire

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --value=(true|false|True|False)                        (required) canExpire value

  --yesreally                                            Override prompt to set expiration flag (be careful!)

EXAMPLE
  set-can-expire --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --value true
```

_See code: [packages/cli/src/commands/releasegold/set-can-expire.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-can-expire.ts)_

### Set-liquidity-provision

Set the liquidity provision to true, allowing the beneficiary to withdraw released gold.

```
USAGE
  $ celocli releasegold:set-liquidity-provision

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --yesreally                                            Override prompt to set liquidity (be careful!)

EXAMPLE
  set-liquidity-provision --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631
```

_See code: [packages/cli/src/commands/releasegold/set-liquidity-provision.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-liquidity-provision.ts)_

### Set-max-distribution

Set the maximum distribution of gold for the given contract

```
USAGE
  $ celocli releasegold:set-max-distribution

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --distributionRatio=distributionRatio                  (required) Amount in range [0, 1000] (3 significant figures)
                                                         indicating % of total balance available for distribution.

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --yesreally                                            Override prompt to set new maximum distribution (be careful!)

EXAMPLE
  set-max-distribution --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --distributionRatio 1000
```

_See code: [packages/cli/src/commands/releasegold/set-max-distribution.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/set-max-distribution.ts)_

### Show

Show info on a ReleaseGold instance contract.

```
USAGE
  $ celocli releasegold:show

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

EXAMPLE
  show --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code: [packages/cli/src/commands/releasegold/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/show.ts)_

### Transfer-dollars

Transfer Celo Dollars from the given contract address. Dollars may be accrued to the ReleaseGold contract via validator epoch rewards.

```
USAGE
  $ celocli releasegold:transfer-dollars

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d        (required) Address of the recipient of Celo Dollars transfer

  --useLedger                                            Set it to use a ledger wallet

  --value=10000000000000000000000                        (required) Value (in Wei) of Celo Dollars to transfer

EXAMPLE
  transfer-dollars --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb
  --value 10000000000000000000000
```

_See code: [packages/cli/src/commands/releasegold/transfer-dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/transfer-dollars.ts)_

### Withdraw

Withdraws `value` released gold to the beneficiary address. Fails if `value` worth of gold has not been released yet.

```
USAGE
  $ celocli releasegold:withdraw

OPTIONS
  --contract=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the ReleaseGold Contract

  --ledgerAddresses=ledgerAddresses                      [default: 1] If --useLedger is set, this will get the first N
                                                         addresses for local signing

  --ledgerConfirmAddress                                 Set it to ask confirmation for the address of the transaction
                                                         from the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses          [default: [0]] If --useLedger is set, this will get the array
                                                         of index addresses for local signing. Example
                                                         --ledgerCustomAddresses "[4,99]"

  --useLedger                                            Set it to use a ledger wallet

  --value=10000000000000000000000                        (required) Amount of released gold (in wei) to withdraw

EXAMPLE
  withdraw --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --value 10000000000000000000000
```

_See code: [packages/cli/src/commands/releasegold/withdraw.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/releasegold/withdraw.ts)_
