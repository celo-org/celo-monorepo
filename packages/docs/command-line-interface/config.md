# `celocli config`

Configure CLI options which persist across commands

## `celocli config:get`

Output network node configuration

```
Output network node configuration

USAGE
  $ celocli config:get

OPTIONS
  --globalHelp  View all available global flags
```

_See code: [src/commands/config/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)_

## `celocli config:set`

Configure running node information for propogating transactions to network

```
Configure running node information for propogating transactions to network

USAGE
  $ celocli config:set

OPTIONS
  -n, --node=node
      URL of the node to run commands against (defaults to 'http://localhost:8545')

  --gasCurrency=(auto|Auto|CELO|celo|cUSD|cusd|cEUR|ceur|cREAL|creal)
      Use a specific gas currency for transaction fees (defaults to 'auto' which uses
      whatever feeCurrency is available)

  --globalHelp
      View all available global flags

EXAMPLES
  set --node ws://localhost:2500

  set --node <geth-location>/geth.ipc

  set --gasCurrency cUSD

  set --gasCurrency CELO
```

_See code: [src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
