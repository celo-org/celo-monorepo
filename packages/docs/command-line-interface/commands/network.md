# Network

View details about the network, like contracts and parameters

## `celocli network:contracts`

Lists Celo core contracts and their addesses.

```text
Lists Celo core contracts and their addesses.

USAGE
  $ celocli network:contracts
```

_See code:_ [_src/commands/network/contracts.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/contracts.ts)

## `celocli network:info`

View general network information such as the current block number

```text
View general network information such as the current block number

USAGE
  $ celocli network:info

OPTIONS
  -n, --lastN=lastN  [default: 1] Fetch info about the last n epochs
```

_See code:_ [_src/commands/network/info.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/info.ts)

## `celocli network:parameters`

View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

```text
View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

USAGE
  $ celocli network:parameters

OPTIONS
  --raw  Display raw numerical configuration
```

_See code:_ [_src/commands/network/parameters.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/parameters.ts)

