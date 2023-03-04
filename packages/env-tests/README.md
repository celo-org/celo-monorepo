# Env-tests

The `env-tests` package is a set of tests that is designed to be run against CELO blockchains and assert that various platform interactions work as intended. It currently has tests for the following:

1. Exchange: Does an exchange on Mento
2. Oracle: Reports an exchange rate
3. Reserve: Tests that reserve spenders can move funds to reserve custodians
4. Transfer: Does simple ERC20 transfers

## Setup

`env-tests` work by deriving keys from a single mnemonic. When run in the context of the monorepo, it will pull the relevant environment mnemonic, otherwise it should be passed to the `context` of the test setup.

All keys derive funds from the "root key" which should be funded. From it, all test keys are funded in the test setup, increase verbosity with the `LOG_LEVEL` env var to `info` or `debug` to see more information.

By default, transfer and exchange tests are performed for cUSD. By setting the env variable `STABLETOKENS` other stabletokens can be included in testing. `STABLETOKENS` can be set to a comma-separated string of stabletokens to test (e.g. `‘cEUR’` for only testing cEUR or `‘cUSD,cEUR’` for testing both cUSD and cEUR). 

As part of the testnet contract deploys in `celotool`, privileged keys like reserve spender or oracles can be authorized directly in the migrations. Hence, the relevant tests will pass on environments like `staging` while failing on public environments as the keys are not yet authorized.

## Running the test

Since all the keys are derived from a single mnemonic, the `env-tests` just need a node for chain interactions and not key management. Theoretically, running against forno would work and the embedded `yarn` commands set that up. However, since Forno currently does not have sticky sessions everywhere, tests can appear flaky. Instead, consider using a local lightest client or port-forwarding with `celotool port-forward -e ${ENVIRONMENT_NAME}`.
