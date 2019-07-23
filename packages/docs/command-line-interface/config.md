# `celocli config`

Configure CLI options which persist across commands

- [`celocli config:get`](#celocli-configget)
- [`celocli config:set`](#celocli-configset)

## `celocli config:get`

Output network node configuration

```
USAGE
  $ celocli config:get

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
```

_See code: [src/commands/config/get.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/get.ts)_

## `celocli config:set`

Configure running node information for propogating transactions to network

```
USAGE
  $ celocli config:set

OPTIONS
  -h, --help               show CLI help
  -l, --logLevel=logLevel
  --node=node              (required) [default: ws://localhost:8546] Node URL
```

_See code: [src/commands/config/set.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/config/set.ts)_
