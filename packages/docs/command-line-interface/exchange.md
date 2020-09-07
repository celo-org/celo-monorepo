---
description: Exchange Celo Dollars and CELO via the stability mechanism
---

## Commands

### Celo

Exchange CELO for Celo Dollars via the stability mechanism. (Note: this is the equivalent of the old exchange:gold)

```
USAGE
  $ celocli exchange:celo

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum value of Celo Dollars to receive
                                                     in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with CELO to exchange

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=10000000000000000000000                    (required) The value of CELO to exchange for Celo Dollars

EXAMPLES
  celo --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
  celo --value 5000000000000 --forAtLeast 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/celo.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/celo.ts)_

### Dollars

Exchange Celo Dollars for CELO via the stability mechanism

```
USAGE
  $ celocli exchange:dollars

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum value of CELO to receive in
                                                     return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo Dollars to exchange

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=10000000000000000000000                    (required) The value of Celo Dollars to exchange for CELO

EXAMPLES
  dollars --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
  dollars --value 10000000000000 --forAtLeast 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/dollars.ts)_

### Gold

Exchange CELO for Celo Dollars via the stability mechanism. _DEPRECATION WARNING_ Use the "exchange:celo" command instead

```
USAGE
  $ celocli exchange:gold

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum value of Celo Dollars to receive
                                                     in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with CELO to exchange

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=10000000000000000000000                    (required) The value of CELO to exchange for Celo Dollars

EXAMPLES
  gold --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
  gold --value 5000000000000 --forAtLeast 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/gold.ts)_

### Show

Show the current exchange rates offered by the Exchange

```
USAGE
  $ celocli exchange:show

OPTIONS
  --amount=amount                                [default: 1000000000000000000] Amount of the token being exchanged to
                                                 report rates for

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/exchange/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/show.ts)_
