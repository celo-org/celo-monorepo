---
description: View details about the network, like contracts and parameters
---

## Commands

### Contracts

Lists Celo core contracts and their addesses.

```
USAGE
  $ celocli network:contracts
```

_See code: [packages/cli/src/commands/network/contracts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/contracts.ts)_

### Info

View general network information such as the current block number

```
USAGE
  $ celocli network:info

OPTIONS
  -n, --lastN=lastN  [default: 1] Fetch info about the last n epochs
```

_See code: [packages/cli/src/commands/network/info.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/info.ts)_

### Parameters

View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

```
USAGE
  $ celocli network:parameters

OPTIONS
  --raw  Display raw numerical configuration
```

_See code: [packages/cli/src/commands/network/parameters.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/parameters.ts)_
