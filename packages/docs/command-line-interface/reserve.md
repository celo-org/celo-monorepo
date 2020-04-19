---
description: Shows information about reserve
---

## Commands

### Status

Shows information about reserve

```
USAGE
  $ celocli reserve:status

EXAMPLE
  status
```

_See code: [packages/cli/src/commands/reserve/status.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/reserve/status.ts)_

### Transfergold

Transfers reserve gold to other reserve address

```
USAGE
  $ celocli reserve:transfergold

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Spender's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Receiving address

  --useLedger                                        Set it to use a ledger wallet

  --useMultiSig                                      True means the request will be sent through multisig.

  --value=value                                      (required) The unit amount of Celo Gold (cGLD)

EXAMPLES
  transfergold --value 9000 --to 0x91c987bf62D25945dB517BDAa840A6c661374402 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
  transfergold --value 9000 --to 0x91c987bf62D25945dB517BDAa840A6c661374402 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig
```

_See code: [packages/cli/src/commands/reserve/transfergold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/reserve/transfergold.ts)_
