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
  --node=node  (required) [default: ws://localhost:8546] Node URL
```

_See code: [packages/cli/src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
