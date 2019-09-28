# celocli

Tool for interacting with the Celo Protocol.

## Development

### Build

Use `yarn build:sdk <NETWORK>` to build the sdk for the target environment (CLI dependency).

Use `yarn build` to compile the CLI.

### Generate docs

Use `yarn docs` to populate `packages/docs` with generated documentation. Generated files should be checked in, and CI will fail if CLI modifications cause changes in the docs which were not checked in.

_See [@celo/dev-cli](https://github.com/celo-org/dev-cli) for how we customize doc generation._

### Known build issues on Linux

> I'm getting the follow error: `Cannot find module '@celo/contractkit'`.

A possible solution is to build the monorepo manually.
Go to the `celo-monorepo` root directory and

```bash
> yarn build
```

If all works well, navigate to `packages/cli`.

> I've got the cli built successfully but the running the `cli` yields: `Error: Returned values aren't valid, did it run Out of Gas?`.

When running the `cli` against a full node, this can mean that the contract artifacts are out of date.
Solution: switch to the `alfajores` branch and build the `celo-monorepo`.

Go to the `celo-monorepo` root directory and

```bash
> git checkout alfajores
> yarn
> yarn build
> cd packages/cli
> ./bin/run account:balance $CELO_ACCOUNT_ADDRESS
```
