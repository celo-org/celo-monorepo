---
description: Transfer CELO and Celo Dollars
---

## Commands

### Celo

Transfer CELO to a specified address. (Note: this is the equivalent of the old transfer:gold)

```
USAGE
  $ celocli transfer:celo

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Amount to transfer (in wei)

  --withTxVerification                               (For transactions bigger than 200 CELO) This flag allows the user
                                                     to generate the transfer in two different transactions. The first
                                                     one will be for a random amount lesser than 1 CELO, that will be
                                                     required as an input to perform the second transaction with the
                                                     rest of the transfer

EXAMPLES
  celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  10000000000000000000
  celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  10000000000000000000 --withTxVerification
```

_See code: [packages/cli/src/commands/transfer/celo.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/celo.ts)_

### Dollars

Transfer Celo Dollars to a specified address.

```
USAGE
  $ celocli transfer:dollars

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Amount to transfer (in wei)

  --withTxVerification                               (For transactions bigger than 500 cUSD) This flag allows the user
                                                     to generate the transfer in two different transactions. The first
                                                     one will be for a random amount lesser than 1 cUSD, that will be
                                                     required as an input to perform the second transaction with the
                                                     rest of the transfer

EXAMPLES
  dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  1000000000000000000
  dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  1000000000000000000 --withTxVerification
```

_See code: [packages/cli/src/commands/transfer/dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/dollars.ts)_

### Gold

Transfer CELO to a specified address. _DEPRECATION WARNING_ Use the "transfer:celo" command instead

```
USAGE
  $ celocli transfer:gold

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Amount to transfer (in wei)

  --withTxVerification                               (For transactions bigger than 200 CELO) This flag allows the user
                                                     to generate the transfer in two different transactions. The first
                                                     one will be for a random amount lesser than 1 CELO, that will be
                                                     required as an input to perform the second transaction with the
                                                     rest of the transfer

EXAMPLE
  gold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  10000000000000000000
```

_See code: [packages/cli/src/commands/transfer/gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/gold.ts)_
