# Protocols

Smart contracts for the Celo protocols, including identity and stability.

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3

### Initial deployment

See the the [testnet helm chart README](../helm-charts/testnet/README.md) for how to expose the RPC endpoint.

Then, to deploy contracts to a network run:

```bash
yarn run init-network -n NETWORK
```

This will deploy the contracts to the network specified in `truffle.js` and save the artifacts to `build/NETWORK`.
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

### Testing

To test the smart contracts, run:

```bash
yarn run test
```

Adding the optional `--gas` flag will print out a report of contract gas usage.
