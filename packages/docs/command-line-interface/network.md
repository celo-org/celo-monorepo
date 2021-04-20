# `celocli network`

View details about the network, like contracts and parameters


## `celocli network:contracts`

Lists Celo core contracts and their addesses.

```
Lists Celo core contracts and their addesses.

USAGE
  $ celocli network:contracts

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)
```

_See code: [src/commands/network/contracts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/contracts.ts)_

## `celocli network:info`

View general network information such as the current block number

```
View general network information such as the current block number

USAGE
  $ celocli network:info

OPTIONS
  -n, --lastN=lastN  [default: 1] Fetch info about the last n epochs
  --globalHelp       View all available global flags
```

_See code: [src/commands/network/info.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/info.ts)_

## `celocli network:parameters`

View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

```
View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.

USAGE
  $ celocli network:parameters

OPTIONS
  --globalHelp  View all available global flags
  --raw         Display raw numerical configuration
```

_See code: [src/commands/network/parameters.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/network/parameters.ts)_
