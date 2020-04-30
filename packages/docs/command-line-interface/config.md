---
description: Configure CLI options which persist across commands
---

## Commands

### Get

Output Celoclo cached configuration

```
USAGE
  $ celocli config:get
```

_See code: [packages/cli/src/commands/config/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)_

### Reset

Resets the cached Celocli data for propogating transactions to network

```
USAGE
  $ celocli config:reset

EXAMPLE
  reset
```

_See code: [packages/cli/src/commands/config/reset.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/reset.ts)_

### Set

Configure running node information for propogating transactions to network

```
USAGE
  $ celocli config:set

OPTIONS
  -n, --node=node                                [default: http://localhost:8545] URL of the node to run commands
                                                 against

  --add                                          If --add flag is set, it will add the configurations to the already
                                                 saved cache. Otherwise will replace the old cache

  --azureVaultName=azureVaultName                If --useAKV is set, this is used to connect to the Azure KeyVault

  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --privateKey=privateKey                        Set to use a specific privateKey. Beware this privateKey will be stored
                                                 on disk.

  --useAKV                                       Set it to use an Azure KeyVault HSM

  --useLedger                                    Set it to use a ledger wallet

EXAMPLES
  set  --node ws://localhost:2500
  set  --node <geth-location>/geth.ipc
  set  --node https://somehost.com  --useLedger
  set  --useLedger  --ledgerCustomAddress "[0, 47, 99]"  --add
  set  --node ws://localhost:2500  --useLedger  --ledgerAddresses 3 --ledgerConfirmAddress
  set  --useAKV  --azureVaultName some-vault
```

_See code: [packages/cli/src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
