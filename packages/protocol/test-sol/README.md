### Building

You can build this project by simply running

```bash
forge build
```


**Note**: Due to a regression in Foundry, you might need to use an older
version. You can install the most recent version verified to work by running

```bash
foundryup --version nightly-f625d0fa7c51e65b4bf1e8f7931cd1c6e2e285e9
```

### Testing

We are in the process of migrating our tests to use [Foundry](https://book.getfoundry.sh/). The tests in this folder have already been migrated from [Truffle](../test).

To run tests with Foundry there's no need to `yarn` or manage any Javascript dependencies. Instead, run

```bash
forge test
```

This will run all tests in this folder. To run only a specific file you can use

```bash
forge test --match-path ./path/to/file.t.sol
```

To run only a specific contract in a test file, you can use

```bash
forge test --match-contract CONTRACT_NAME
```

To run only a specific test, you can use

```bash
forge test --match-test test_ToMatch
```

You can specify a verbosity level with the `-v`, `-vv`, `-vvv`, and `-vvvv` flags. The more `v`s you put the more verbose the output will be.

Putting it all together, you might run something like

```bash
forge test --match-path ./path/to/file.t.sol --match-test test_ToMatch -vvv
```

You can read more about the `forge test` command [here](https://book.getfoundry.sh/reference/forge/forge-test).

To skip a specific test, you can add `vm.skip(true);` as the first line of the test.

If a test name begins with `testFail` rather than `test`, foundry will expect the test to fail / revert.

Please follow the naming convention `test_NameOfTest` / `testFail_NameOfTest`.

If you're new to Forge / Foundry, we recommend looking through the [Cheatcode Reference](https://book.getfoundry.sh/cheatcodes/) for a list of useful commands that make writing tests easier.



