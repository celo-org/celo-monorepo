---
description: Configure CLI options which persist across commands
---

## Commands

### Get

Output network node configuration

```
USAGE
  $ celocli config:get
```

_See code: [packages/cli/src/commands/config/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)_

### Set

Configure running node information for propogating transactions to network

```
USAGE
  $ celocli config:set

OPTIONS
  -n, --node=node                                URL of the node to run commands against (defaults to
                                                 'http://localhost:8545')

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)

EXAMPLES
  set  --node ws://localhost:2500
  set  --node <geth-location>/geth.ipc
  set --gasCurrency cUSD
  set --gasCurrency CELO
```

_See code: [packages/cli/src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
