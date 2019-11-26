# Examples

## Interacting with cGold & cDollar

celo-blockchain has two initial coins: cGold and cDollar (stableToken).
Both implement the ERC20 standard, and to interact with them is as simple as:

```ts
const goldtoken = await kit.contract.getGoldToken()

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

To interact with cDollar, is the same but with a different contract:

```ts
const stabletoken = await kit.contract.getStableToken()
```

## Interacting with Other Contracts

Apart from GoldToken and StableToken, there are many core contracts.

For the moment, we have contract wrappers for:

- Exchange (Uniswap kind exchange between Gold and Stable tokens)
- Validators
- LockedGold

In the following weeks, we will add some wrappers for all other contracts

## Accessing web3 contract wrappers

Some user might want to access web3 native contract wrappers.

To do so, you can:

```ts
const web3Exchange = await kit._web3Contracts.getExchange()
```

We expose native wrappers for all Celo core contracts.

## A Note About Contract Addresses

Celo Core Contracts addresses, can be obtained by looking at the `Registry` contract.
That's actually how `kit` obtain them.

We expose the registry api, which can be accessed by:

```ts
const goldTokenAddress = await kit.registry.addressFor(CeloContract.GoldToken)
```

## Sending Custom Transactions

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

## Debugging

If you need to debug `kit`, we use the well known [debug](https://github.com/visionmedia/debug) node library.

So set the environment variable `DEBUG` as:

```bash
DEBUG="kit:*,
```
