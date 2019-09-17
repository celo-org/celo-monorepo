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

> I'm getting the follow error during the above build: `lerna ERR! yarn run build exited 1 in '@celo/protocol'`.

This error implies that the `truffle` project is not initialized.
Navigate to `celo-monorepo/packages/protocol` and initialize the truffle project.
Make sure you do NOT overwrite any existing contracts, migrations or tests.

```bash
> npm i -g truffle
> truffle init
This directory is non-empty...
? Proceed anyway? Yes
✔ Preparing to download
✔ Downloading
contracts already exists in this directory...
? Overwrite contracts? No
migrations already exists in this directory...
? Overwrite migrations? No
test already exists in this directory...
? Overwrite test? No
✔ Cleaning up temporary files
✔ Setting up box
```

After doing this you should be able to continue the build process

> I've got the cli built successfully but the running the `cli` yields: `Error: Returned values aren't valid, did it run Out of Gas?`.

When running the `cli` against a full node, this can mean that the contract artifacts are out of date.
Solution: switch to the `alfajores` branch and build the `celo-monorepo`.

Go to the `celo-monorepo` root directory and

```bash
> git checkout alfajores
> yarn
> yarn build
> git checkout master
> yarn
> cd packages/cli
> ./bin/run account:balance $CELO_ACCOUNT_ADDRESS
```
