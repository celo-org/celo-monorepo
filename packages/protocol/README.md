# Protocols

Smart contracts for the Celo protocols, including identity and stability.

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3

### Initial deployment

See the [testnet helm chart README](../helm-charts/testnet/README.md) for how to expose the RPC endpoint.

Then, to deploy contracts to a network run:

```bash
yarn run init-network -n NETWORK
```

This will deploy the contracts to the network specified in `truffle-config.js` and save the artifacts to `build/NETWORK`.
If your network was deployed with `helm`, you will probably set `NETWORK` the same as your `NAME` (which sets `NAMESPACE_NAME` and `RELEASE_NAME`). For more clarity on these names, also see the [testnet helm chart README](../helm-charts/testnet/README.md)

### Migrations

If a new contract needs to be deployed, create a migration file in the `migrations/` directory, prefixing it with the successor of the highest current migration number.

To apply any new migrations to a network, run:

```bash
yarn run migrate -n NETWORK
```

### Accounts

To give an account some gold, wrapped gold, and stable token, run:

```bash
yarn run faucet -n NETWORK -a ACCOUNT_ADDRESS
```

You can check balances by running:

```bash
yarn run get-balances -n NETWORK -a ACCOUNT_ADDRESS
```

You can run 'onlyOwner' methods via the [MultiSig](contracts/common/MultiSig.sol) by running:

```bash
yarn run govern -n NETWORK -c "stableToken.setMinter(0x1234)"
```

### Build artifacts

When interacting with one of our Kubernetes-deployed networks, you can download the build artifacts to a local directory using:

```bash
yarn run download-artifacts -n NAME
```

You must run this before interacting with one of these networks to have the build artifacts available locally.

If you changed the build artifacts (e.g. by running the `init-network`, `migrate`, or `upgrade` script), upload the new build artifacts with:

```bash
yarn run upload-artifacts -n NAME
```

By default, `NAME` will be set as `RELEASE_NAME`, `NAMESPACE_NAME`, `TESTNET_NAME` which you should have used with the same name in prior instructions. If you used separate names for the above, you can customize the run with the `-r -n -t` flags respectively.

### Console

To start a truffle console run:

```
yarn console -f -n rc1
```

Options:

- "-f" for Forno mode, otherwise there needs to be a node running at localhost:8585
- "-n <network>" possible values are: "rc1", "alfajores", "baklava"

All compiled assets from `build/contracts` are injected in scope so for example you can do:

```
truffle(rc1)> let exchange = await ExchangeEUR.at("0xE383394B913d7302c49F794C7d3243c429d53D1d")
```

To instantiate a contract at a known address, and then interact with it:

```
truffle(rc1)> exchange.getBuyAndSellBuckets(true)
Result {
  '0': <BN: 744b931719b5411d57c3>,
  '1': <BN: 17105bfef1e6943fd144> }

```

Or you can use ContractKit:

```
truffle(rc1)> let kit = require('@celo/contractkit').newKitFromWeb3(web3)
truffle(rc1)> let exchange = await kit.contracts.getExchange()
```

### Testing

Warning / TODO: We are migrating our tests to Foundry, so this section may be out of date. For instruction on how to run tests with Foundry see [here](./test-sol/README.md).

To test the smart contracts, run:

```bash
yarn run test
```

Adding the optional `--gas` flag will print out a report of contract gas usage.

To test a single smart contract, run:

```bash
yarn run test ${contract name}
```

Adding the optional `--gas` flag will print out a report of contract gas usage.

For quick test iterations run:

```bash
yarn run quicktest
```

or for a single contract:

```bash
yarn run quicktest ${contract name}
```

For `quicktest` to work correctly a contract's migration dependencies have to be uncommented in `scripts/bash/backupmigrations.sh`.

Compared to the normal test command, quicktest will:

1. Not run the pretest script of building solidity (will still be run as part of truffle test) and compiling typescript. This works because truffle can run typescript "natively".
2. Only migrate selected migrations as set in `backupmigrations.sh` (you'll likely need at least one compilation step since truffle seems to only run compiled migrations)

## Verify released smart contracts

1. Update CeloScanApi in env.json file
2. Run verification command

```bash
yarn truffle-verify [ContractName]@[Contract address]  --network [network] --forno [network rpc url]
```

example:

```bash
yarn truffle-verify MentoFeeHandlerSeller@0x4efa274b7e33476c961065000d58ee09f7921a74 --network mainnet --forno https://forno.celo.org
```

### Possible problems

1.  Some of old smart contracts have slightly different bytecode when verified (it is usually just few bytes difference). Some of the smart contracts were originally deployed with version 0.5.8 instead of 0.5.13 even though there is no history trace about this in our monorepo.

2.  Bytecode differs because of missing library addresses on CeloScan. Json file that will be manually uploaded to CeloScan needs to have libraries root element updated. Library addresses is possible to get either manually or with command which will generate libraries.json.

    ```bash
    yarn verify-deployed -n $NETWORK -b $PREVIOUS_RELEASE -f
    ```

    ```javascript
    {
      "libraries": {
              "/contracts/governance/Governance.sol": {
                  "Proposals": "0x38afc0dc55415ae27b81c24b5a5fbfe433ebfba8",
                  "IntegerSortedLinkedList": "0x411b40a81a07fcd3542ce5b3d7e215178c4ca2ef",
                  "AddressLinkedList": "0xd26d896d258e258eba71ff0873a878ec36538f8d",
                  "Signatures": "0x69baecd458e7c08b13a18e11887dbb078fb3cbb4",
                  "AddressSortedLinkedList": "0x4819ad0a0eb1304b1d7bc3afd7818017b52a87ab"
              }
          }
    }
    ```

## Calculate smart contract sizes

Sometimes it's useful to know the bytecode size of core contracts.
We can calculate that in two ways:

1. Using the bytecode of actually deployed smart contracts.
2. Using the build artifacts of locally built smart contracts.

### Using build artifacts

Usage:

```sh
$ yarn size:artifacts
```

Description: This command uses a script ([`get_smart_contract_size_from_build_artifacts.sh`](./scripts/bash/get_smart_contract_size_from_build_artifacts.sh)) to calculate the size of smart contracts from Truffle build artifacts. It extracts the `deployedBytecode` of each contract, calculates its size in kilobytes, and outputs the results to a CSV file in the `scripts/bash/out/` directory.

> [!NOTE]  
> The script requires Truffle build artifacts to be located in the `packages/protocol/build/` directory.

For example:

```sh
$ yarn size:artifacts

# ...
ReleaseGold,31.721
OdisPaymentsProxy,2.868
Data extraction complete. Results saved to /Users/arthur/Documents/celo-org/celo-monorepo/packages/protocol/scripts/bash/out/build_artefact_bytecode_sizes_20240509_151111.csv
✨  Done in 9.57s.
```

How it works:

1.  The script first creates an output directory named `out` in the current directory if it doesn't exist.
2.  It then generates a timestamp and uses it to create a unique output file in the `out` directory.
3.  The script searches for all JSON files in the `protocol/build/contracts`, `protocol/build/contracts-0.8`, and `protocol/build/contracts-mento` directories.
4.  For each JSON file found, it extracts the contract name and `deployedBytecode` using the `jq` command-line JSON processor.
5.  It calculates the size of the `deployedBytecode` in kilobytes and appends the contract name and size to a temporary file.
6.  The script then sorts the data in the temporary file by size in descending order and appends it to the output file.
7.  Finally, it removes the temporary file and prints a completion message with the location of the output file.

Output: The output is a CSV file named `build_artefact_bytecode_sizes_<timestamp>.csv` in the `out` directory. Each line in the file contains a contract name and its size in kilobytes, sorted in descending order by size.

Requirements: This script requires the `jq` and `bc` command-line tools to be installed on your system.

### Using contracts deployed on-chain

Default usage (Celo Mainnet):

```sh
$ yarn size:onchain
```

Custom usage (any Celo RPC URL)

```sh
$ export RPC_URL=https://alfajores-forno.celo-testnet.org
$ yarn size:onchain
```

Description: This command uses a script ([`get_smart_contract_size_from_onchain_address.sh`](./scripts/bash/get_smart_contract_size_from_onchain_address.sh)) to calculate the size of smart contracts deployed on Celo Mainnet. It uses the Celo CLI to fetch the addresses of all core contracts, and Foundry to get the bytecode deployed at each address. The size of the bytecode is then calculated and the results are output to a CSV file.

> [!NOTE]  
> The script requires the Celo CLI and Foundry to be installed on your system.

For example:

```sh
$ yarn size:onchain

No custom RPC URL provided. Using default RPC URL: https://forno.celo.org
# ...
StableTokenEUR,0x434563B0604BE100F04B7Ae485BcafE3c9D8850E,9.180
Validators,0xe52EaC18fB3C1e1713e73d4A5b7dCb12a2f2C697,58.228
Data extraction complete. Results saved to /Users/arthur/Documents/celo-org/celo-monorepo/packages/protocol/out/onchain_bytecode_sizes_20240509_145556.csv
✨  Done in 19.15s.
```

Or with custom RPC URL:

```sh
$ export RPC_URL=https://alfajores-forno.celo-testnet.org
$ yarn size:onchain

Using custom RPC URL: https://alfajores-forno.celo-testnet.org
# ...
StableTokenEUR,0x3Bd899048f4f6951fFeB5474205B79FDB09D6212,9.180
Validators,0xF17D8624e0c3402D02b6F8D5870Fff0Dd35e4f0B,58.228
Data extraction complete. Results saved to /Users/arthur/Documents/celo-org/celo-monorepo/packages/protocol/scripts/bash/out/onchain_bytecode_sizes_20240510_122254.csv
✨  Done in 38.59s.
```

How it works:

1.  The script first creates an output directory named `out` in the current directory if it doesn't exist.
2.  It then generates a timestamp and uses it to create a unique output file in the `out` directory.
3.  The script sets the RPC URL to `https://forno.celo.org` (default), or uses the user-specific RPC URL.
4.  It initializes a temporary file and the output file with headers.
5.  The script uses the `celocli network:contracts` command to fetch the addresses of all core contracts.
6.  For each contract address, it uses Foundry to get the deployed bytecode.
7.  It calculates the size of the bytecode in kilobytes and appends the contract name, address, and size to the output file.

Output: The output is a CSV file named `onchain_bytecode_sizes_<timestamp>.csv` in the `out` directory. Each line in the file contains a contract name, its implementation address, and its size in kilobytes.


# Compare releases and get PRs changing smart contracts

To get the list of PRs that changed smart contracts between two releases, run:

```sh
yarn compare-git-tags [git_tag/branch] [git_tag/branch]
```

Example:

```sh
yarn compare-git-tags release/core-contracts/11 release/core-contracts/12
```

Example output:

PRs that made these changes:

16442165a Deactivate BlochainParameters Contract on L2 (#11008)
198f6215a SortedLinkedList Foundry Migration (#10846)
