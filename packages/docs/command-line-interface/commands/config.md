# Config

Configure CLI options which persist across commands

## `celocli config:get`

Output network node configuration

```text
Output network node configuration

USAGE
  $ celocli config:get

OPTIONS
  --globalHelp  View all available global flags
```

_See code:_ [_src/commands/config/get.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)

## `celocli config:set`

Configure running node information for propogating transactions to network

```text
Configure running node information for propogating transactions to network

USAGE
  $ celocli config:set

OPTIONS
  -n, --node=node                                          URL of the node to run
                                                           commands against (defaults to
                                                           'http://localhost:8545')

  --gasCurrency=(auto|Auto|CELO|celo|cUSD|cusd|cEUR|ceur)  Use a specific gas currency
                                                           for transaction fees
                                                           (defaults to 'auto' which
                                                           uses whatever feeCurrency is
                                                           available)

  --globalHelp                                             View all available global
                                                           flags

EXAMPLES
  set --node ws://localhost:2500

  set --node <geth-location>/geth.ipc

  set --gasCurrency cUSD

  set --gasCurrency CELO
```

_See code:_ [_src/commands/config/set.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)

