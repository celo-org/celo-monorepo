# ContractKit

Celo's ContractKit is a library to help developers and validators to interact with the celo-blockchain.

ContractKit supports the following functionality:

- Connect to a node
- Access web3 object to interact with node's Json RPC API
- Send Transaction with celo's extra fields: (feeCurrency)
- Simple interface to interact with cGLD and cUSD
- Simple interface to interact with Celo Core contracts
- Utilities

## User Guide

### Getting Started

To install:

```bash
npm install @celo/contractkit@baklava
// or
yarn add @celo/contractkit@baklava
```

You will need node version `8.13.0` or higher.

To start working with contractkit you need a `kit` instance:

```ts
import { newKit } from '@celo/contractkit'

const kit = newKit('https://alfajores-forno.celo-testnet.org:8545')
```

To access web3:

```ts
await kit.web3.eth.getBalance(someAddress)
```

### Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { newKit, CeloContract } from '@celo/contractkit'

async function getKit(myAddress: string) {
  const kit = newKit('https://alfajores-forno.celo-testnet.org:8545')

  // default from
  kit.defaultAccount = myAddress
  // paid gas in celo dollars
  await kit.setFeeCurrency(CeloContract.StableToken)
  return kit
}
```

### Interacting with cGLD & cUSD

celo-blockchain has two initial coins: cGLD and cUSD (stableToken).
Both implement the ERC20 standard, and to interact with them is as simple as:

```ts
const goldtoken = await kit.contracts.getGoldToken()

const balance = await goldtoken.balanceOf(someAddress)
```

To send funds:

```ts
const oneGold = kit.web3.utils.toWei('1', 'ether')
const tx = await goldtoken.transfer(someAddress, oneGold).send({
  from: myAddress,
})

const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

To interact with cUSD, is the same but with a different contract:

```ts
const stabletoken = await kit.contracts.getStableToken()
```

### Interacting with Other Contracts

Apart from GoldToken and StableToken, there are many core contracts.

For the moment, we have contract wrappers for:

- Accounts
- Exchange (Uniswap kind exchange between Gold and Stable tokens)
- Validators
- LockedGold
- GoldToken
- StableToken
- Attestations

In the following weeks will add wrapper for all other contracts

### Accessing web3 contract wrappers

Some user might want to access web3 native contract wrappers.

To do so, you can:

```ts
const web3Exchange = await kit._web3Contracts.getExchange()
```

We expose native wrappers for all Celo core contracts.

The complete list of Celo Core contracts is:

- Accounts
- Attestations
- LockedGold
- Escrow
- Exchange
- FeeCurrencyWhitelist
- GasPriceMinimum
- GoldToken
- Governance
- MultiSig
- Random
- Registry
- Reserve
- SortedOracles
- StableToken
- Validators

## A Note About Contract Addresses

Celo Core Contracts addresses, can be obtained by looking at the `Registry` contract.
That's actually how `kit` obtain them.

We expose the registry api, which can be accessed by:

```ts
const goldTokenAddress = await kit.registry.addressFor(CeloContract.GoldToken)
```

### Sending Custom Transactions

Celo transaction object is not the same as Ethereum's. There are three new fields present:

- feeCurrency (address of the ERC20 contract to use to pay for gas and the gateway fee)
- gatewayFeeRecipient (coinbase address of the full serving the light client's trasactions)
- gatewayFee (value paid to the gateway fee recipient, denominated in the fee currency)

This means that using `web3.eth.sendTransaction` or `myContract.methods.transfer().send()` should be avoided.

Instead, `kit` provides an utility method to send transaction in both scenarios. **If you use contract wrappers, there is no need to use this.**

For a raw transaction:

```ts
const tx = kit.sendTransaction({
  from: myAddress,
  to: someAddress,
  value: oneGold,
})
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

When interacting with a web3 contract object:

```ts
const goldtoken = await kit._web3Contracts.getGoldToken()
const oneGold = kit.web3.utils.toWei('1', 'ether')

const txo = await goldtoken.methods.transfer(someAddress, oneGold)
const tx = await kit.sendTransactionObject(txo, { from: myAddress })
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

### Debugging

If you need to debug `kit`, we use the well known [debug](https://github.com/visionmedia/debug) node library.

So set the environment variable `DEBUG` as:

```bash
DEBUG="kit:*,
```
