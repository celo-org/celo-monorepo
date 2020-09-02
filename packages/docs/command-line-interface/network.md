---
description: Prints Celo contract addesses.
---

## Commands

### Contracts

Prints Celo contract addesses.

```
USAGE
  $ celocli network:contracts

OPTIONS
  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)
```

_See code: [packages/cli/src/commands/network/contracts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/contracts.ts)_

### Parameters

View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

```
USAGE
  $ celocli network:parameters

OPTIONS
  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)
```

_See code: [packages/cli/src/commands/network/parameters.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/parameters.ts)_
