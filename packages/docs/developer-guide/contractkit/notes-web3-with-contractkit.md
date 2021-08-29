# Using Web3 from the Kit

Although the [Web3 library](https://web3js.readthedocs.io/) was intended to be used only with `Ethereum`, due to the nature of `Celo`, we can still use the majority of its features. The ContractKit, for every interaction with the node, uses internally a Web3 instance.

Because of this, the `Ethereum` JSON-RPC calls done via the web3 \(except some specific calls that we will explain in this page\) are also supported

For example:

```typescript
const web3 = kit.web3

web3.eth.getBalance(someAddress)
```

or

```typescript
const web3 = kit.web3

web3.eth.getBlock("latest")
```

will work the same way.

## Web3 limitations

As you have read in our guide, Celo uses some extra fields: `feeCurrency`, `gatewayFeeRecipient` and `gatewayFee`, that among other things allows you to pay gas with ERC20 Tokens. These fields are expected by the node.

To facilitate the life of every developer, we decided to wrap the `Provider` set in the `Web3` instance, and add our way to handle local signing using these new fields. Similar to what _Metamask_ does, we intercept every transaction and perform a local signing when required. This wrapper is called `CeloProvider`.

This let you use the Web3 instance to interact with node's Json RPC API in a transparent way, just deciding which Provider do you need.

This is also the reason that the `Kit` requires a valid provider from the beginning.

## Local Signing

As part of the [Donut hardfork](https://medium.com/celoorg/dissecting-the-donut-hardfork-23cad6015fa2) network upgrade that occurred on May 19th, 2021, the Celo network now accepts Ethereum-style transactions as well as Celo transactions. This means that you can use Ethereum transaction signing tools \(like [Metamask](../../getting-started/wallets/using-metamask-with-celo/), web3.js and ethers.js\) to sign transactions for the Celo network. Remember that Celo is a separate layer 1 blockchain from Ethereum, so do not send Ethereum assets directly to your Celo account address on Ethereum.

