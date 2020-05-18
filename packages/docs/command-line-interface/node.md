---
description: Manage your Celo node
---

# Node

## Accounts

List the addresses that this node has the private keys for.

```text
USAGE
  $ celocli node:accounts

OPTIONS
  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --useLedger                                    Set it to use a ledger wallet
```

_See code:_ [_packages/cli/src/commands/node/accounts.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/node/accounts.ts)

## Synced

Check if the node is synced

```text
USAGE
  $ celocli node:synced

OPTIONS
  --verbose  output the full status if syncing
```

_See code:_ [_packages/cli/src/commands/node/synced.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/node/synced.ts)

