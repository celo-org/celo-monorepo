---
description: Configure CLI options which persist across commands
---

# Config

## Get

Output network node configuration

```text
USAGE
  $ celocli config:get
```

_See code:_ [_packages/cli/src/commands/config/get.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)

## Set

Configure running node information for propogating transactions to network

```text
USAGE
  $ celocli config:set

OPTIONS
  -n, --node=node  (required) [default: http://localhost:8545] URL of the node to run commands against

EXAMPLES
  set  --node ws://localhost:2500
  set  --node <geth-location>/geth.ipc
```

_See code:_ [_packages/cli/src/commands/config/set.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)

