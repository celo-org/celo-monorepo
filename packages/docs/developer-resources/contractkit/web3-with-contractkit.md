# Using Web3 with ContractKit

The ContractKit, for every interaction with the node, uses internally a Web3 instance.

At the moment, we support two different ways to initialize the ContractKit:

* With a given instance of Web3, that has a **valid** Provider 
  ```ts
    const web3Instance: Web3 = new Web3('https://alfajores-forno.celo-testnet.org')
    ... 
    Kit.newKitFromWeb3(web3Instance)
  ```
* With a valid URL for a RPC Provider
  ```ts
    Kit.newKit('https://alfajores-forno.celo-testnet.org')
  ```

## Why do we need a valid Provider? What we are doing under the hood...

As you have read in our guide, Celo uses some extra fields: `feeCurrency`, `gatewayFeeRecipient` and `gatewayFee`, that among other things allows you yo pay gas with ERC20 Tokens. These fields are expected by the node.

To facilitate the life of every developer, we decided to wrap the `Provider` set in the `Web3` instance, and add our way to handle local signing using these new fields. Similar to what *Metamask* does, we intercept every transaction and perform a local signing when required.

This let you use the Web3 instance to interact with node's Json RPC API in a transparent way, just deciding which Provider do you need.

Web3 provides an alternative way to locally sign transactions which is the usage of web.et.account module to register local accounts, but since Celo transactions are different to the Ethereum ones, this does not work with Celo, hence **you must not use it**.
