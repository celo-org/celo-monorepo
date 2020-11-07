# Using Web3 with ContractKit

Although the [Web3 library](https://web3js.readthedocs.io/) was intended to be used only with `Ethereum`, due to the nature of `Celo`, we can still use the majority of its features.
The ContractKit, for every interaction with the node, uses internally a Web3 instance.

Because of this, the `Ethereum` JSON-RPC calls done via the web3 (except some specific calls that we will explain in this page) are also supported

For example:

```ts
const web3 = kit.web3

web3.eth.getBalance(someAddress)
```

or

```ts
const web3 = kit.web3

web3.eth.getBlock("latest")
```

will work the same way

## Web3 limitations

As you have read in our guide, Celo uses some extra fields: `feeCurrency`, `gatewayFeeRecipient` and `gatewayFee`, that among other things allows you yo pay gas with ERC20 Tokens. These fields are expected by the node.

To facilitate the life of every developer, we decided to wrap the `Provider` set in the `Web3` instance, and add our way to handle local signing using these new fields. Similar to what *Metamask* does, we intercept every transaction and perform a local signing when required. This wrapper is called `CeloProvider`.

This let you use the Web3 instance to interact with node's Json RPC API in a transparent way, just deciding which Provider do you need.

This is also the reason that the `Kit` requires a valid provider from the beginning

## Local Signing Problem

`Web3` provides an alternative way to locally sign transactions which is the usage of `web3.eth.accounts.signTransaction` module to register local accounts, but since Celo transactions are different to the Ethereum ones, this does not work with Celo, hence **you must not use it**.