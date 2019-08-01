# celocli

Tool for interacting with the Celo Protocol.

## Development

Use `yarn build:sdk <NETWORK>` to build the sdk for the target environment (CLI dependency).

Use `yarn build` to compile the CLI.

Use `yarn docs` to populate `packages/docs` with generated documentation. Generated files should be checked in, and CI will fail if CLI modifications cause changes in the docs which were not checked in.

_See [@celo/dev-cli](https://github.com/celo-org/dev-cli) for how we customize doc generation._
