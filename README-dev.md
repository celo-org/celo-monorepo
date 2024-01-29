# README GUIDE FOR CELO DEVELOPERS

## How to run a local testnet

Often when developing, it is useful to create a test network localy using the full celo-blockchain binary to go beyond what can be done with other options such as [Ganache](https://www.trufflesuite.com/ganache)

The quickest way to get started with a local testnet is by running `yarn celotool local-testnet` from the `monorepo` root.

This command will create a local testnet with a single validator node and deploy all smart contract migrations to it.
Once the network is initialized a NodeJS REPL is provided to help interact with the running nodes.
For more options, consult `yarn celotool local-testnet --help`, which provides an overview of the tool and its options.


### Verify installation in Docker

Test installation in isolation using Docker.
This confirms that it is locally installable and does not have implicit dependency on rest of the `celo-monorepo` or have an implicit dependency which is an explicit dependency of another `celo-monorepo` package.
