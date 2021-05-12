# ContractKit

Celo's ContractKit is a library to help developers and validators to interact with the celo-blockchain.

ContractKit supports the following functionality:

- Connect to a node
- Access web3 object to interact with node's Json RPC API
- Send Transaction with celo's extra fields: (feeCurrency)
- Simple interface to interact with CELO and cUSD
- Simple interface to interact with Celo Core contracts
- Utilities

## User Guide

### Getting Started

To install:

```bash
npm install @celo/contractkit
// or
yarn add @celo/contractkit
```

You will need Node.js v12.x. 

To start working with contractkit you need a `kit` instance:

```ts
import { newKit } from '@celo/contractkit'

// Remotely connect to the Alfajores testnet
const kit = newKit('https://alfajores-forno.celo-testnet.org')
```

To access web3:

```ts
await kit.web3.eth.getBalance(someAddress)
```

### Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { newKit, CeloContract } from '@celo/contractkit'

async function getKit(myAddress: string, privateKey: string) {
  const kit = newKit('https://alfajores-forno.celo-testnet.org')

  // default from account 
  kit.defaultAccount = myAddress
  
  // add the account private key for tx signing when connecting to a remote node
  kit.connection.addAccount(privateKey)
  
  // paid gas in celo dollars
  await kit.setFeeCurrency(CeloContract.StableToken)
  
  return kit
}
```

### Interacting with CELO & cUSD

celo-blockchain has two initial coins: CELO and cUSD (stableToken).
Both implement the ERC20 standard, and to interact with them is as simple as:

```ts
// get the CELO contract
const celoToken = await kit.contracts.getGoldToken()

// get the cUSD contract
const stableToken = await kit.contracts.getStableToken()

const celoBalance = await celoToken.balanceOf(someAddress)
const cusdBalance = await stableToken.balanceOf(someAddress)
```

To send funds:

```ts
const oneGold = kit.connection.web3.utils.toWei('1', 'ether')
const tx = await goldToken.transfer(someAddress, oneGold).send({
  from: myAddress
})

const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

If you would like to pay fees in cUSD, set the gas price manually:

```ts
const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
const gasPriceMinimumContract = await kit.contracts.getGasPriceMinimum()
const gasPriceMinimum = await gasPriceMinimumContract.getGasPriceMinimum(stableTokenAddress)
const gasPrice = Math.ceil(gasPriceMinimum * 1.3) // Wiggle room if gas price minimum changes before tx is sent
contractKit.setFeeCurrency(CeloContract.StableToken) // Default to paying fees in cUSD

const stableTokenContract = kit.contracts.getStableToken()
const tx = await stableTokenContract
  .transfer(recipient, weiTransferAmount)
  .send({ from: myAddress, gasPrice })
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
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
const oneGold = kit.connection.web3.utils.toWei('1', 'ether')

const txo = await goldtoken.methods.transfer(someAddress, oneGold)
const tx = await kit.sendTransactionObject(txo, { from: myAddress })
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

### More Information

You can find more information about the ContractKit in the Celo docs at [https://docs.celo.org/developer-guide/contractkit](https://docs.celo.org/developer-guide/contractkit).

### Debugging

If you need to debug `kit`, we use the well known [debug](https://github.com/visionmedia/debug) node library.

So set the environment variable `DEBUG` as:

```bash
DEBUG="kit:*,
```
