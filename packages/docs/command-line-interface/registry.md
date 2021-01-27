---
description: Interact with the contract registry
---

## Commands

### List

List contracts and their addresses in the registry

```
USAGE
  $ celocli registry:list

OPTIONS
  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/registry/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/registry/list.ts)_
