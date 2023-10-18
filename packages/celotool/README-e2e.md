# Celo-Blockchain End-to-End Tests

This package contains a number of end-to-end tests that depend both on the
monorepo protocol package and the Golang celo-blockchain implementation.

## Setup

1.  Run `yarn` to install node dependencies
2.  Other dependencies:
    1.  `nc`, the [netcat](https://en.wikipedia.org/wiki/Netcat) networking utility

## Usage

The tests are run using bash script wrappers. They are the
`ci_test_<TEST NAME>.sh` files in this package. Each requires a version of
celo-blockchain to be specified, which can be done in two ways.

### Celo-blockchain built from local source

```
./ci_test_governance.sh local PATH
```

Where `PATH` is a path to a local source repository for celo-blockchain.

### Celo-blockchain built from a specific GitHub branch

```
./ci_test_governance.sh checkout BRANCH
```
