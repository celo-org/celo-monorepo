---
description: Analyze downtime
---

## Commands

### Downtime

Analyze downtime

```
USAGE
  $ celocli network:downtime

OPTIONS
  --end=end      (required) Last block
  --start=start  (required) First block

EXAMPLE
  downtime --start 12300 --end 13300
```

_See code: [packages/cli/src/commands/network/downtime.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/downtime.ts)_

### Parameters

View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

```
USAGE
  $ celocli network:parameters
```

_See code: [packages/cli/src/commands/network/parameters.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/parameters.ts)_
