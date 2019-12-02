# Getting Started

## Installation and System Requirements

To install, run the following:

```bash
npm install @celo/contractkit
// or
yarn add @celo/contractkit
```

You will need node version `8.13.0` or higher.

## Initializing the Kit

To start working with contractkit you need a `kit` instance:

```ts
import { newKit } from '@celo/contractkit'

const kit = newKit('https://alfajores-infura.celo-testnet.org')
```

To access web3:

```ts
const web3 = kit.web3

web3.eth.getBalance(someAddress)
```

## Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { CeloContract } from '@celo/contractkit'

// default from
kit.defaultAccount = myAddress
// paid gas in celo dollars
await kit.setFeeCurrency(CeloContract.StableToken)
```

You're ready to start using ContractKit! See the [Examples](examples.md) section to learn more.
