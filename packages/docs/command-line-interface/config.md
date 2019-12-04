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
  -n, --node=node  (required) [default: http://localhost:8545] URL of the node to run commands against

EXAMPLE
  set  --node ws://localhost:2500
```

_See code: [packages/cli/src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
