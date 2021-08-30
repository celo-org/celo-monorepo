# Using the kit

The following are some examples of the capabilities of the `ContractKit`, assuming it is already connected to a node. If you aren't connected, [here is a refresher.](../start/hellocontracts.md#deploy-to-alfajores)

## Setting Default Tx Options

`kit` allows you to set default transaction options:

```typescript
import { CeloContract } from '@celo/contractkit'

let accounts = await kit.web3.eth.getAccounts()
kit.defaultAccount = accounts[0]
// paid gas in cUSD
await kit.setFeeCurrency(CeloContract.StableToken)
```

## Getting the Total Balance

This method from the `kit` will return the CELO, locked CELO, cUSD and total balance of the address

```typescript
let totalBalance = await kit.getTotalBalance(myAddress)
```

## Deploy a contract

Deploying a contract with the default account already set. Simply send a transaction with no `to:` field. See more about sending custom transactions below.

You can verify the deployment on the [Alfajores block explorer here](https://alfajores-blockscout.celo-testnet.org/). Wait for the receipt and log it to get the transaction details.

```typescript
let bytecode = '0x608060405234...' // compiled Solidity deployment bytecode

let tx = await kit.sendTransaction({
    data: bytecode
})

let receipt = tx.waitReceipt()
console.log(receipt)
```

## Sending Custom Transactions

Celo transaction object is not the same as Ethereum's. There are three new fields present:

* `feeCurrency` \(address of the ERC20 contract to use to pay for gas and the gateway fee\)
* `gatewayFeeRecipient` \(coinbase address of the full serving the light client's trasactions\)
* `gatewayFee` \(value paid to the gateway fee recipient, denominated in the fee currency\)

This means that using `web3.eth.sendTransaction` or `myContract.methods.transfer().send()` should be **avoided**.

Instead, `contractkit` provides an utility method to send transaction in both scenarios. **If you use contract wrappers, there is no need to use this.**

For a raw transaction:

```typescript
const tx = kit.sendTransaction({
  from: myAddress,
  to: someAddress,
  value: oneGold,
})
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

When interacting with a web3 contract object:

```typescript
const goldtoken = await kit._web3Contracts.getGoldToken()
const oneGold = kit.web3.utils.toWei('1', 'ether')

const txo = await goldtoken.methods.transfer(someAddress, oneGold)
const tx = await kit.sendTransactionObject(txo, { from: myAddress })
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

## Interacting with Custom contracts

You can use ContractKit to interact with any deployed smart contract, provided you have the contract address and the [ABI](https://docs.soliditylang.org/en/latest/abi-spec.html). To do so, you will initialize a new `web3` Contract instance. Then you can call functions on the contract instance to read state or send transactions to update the contract. You can see some code snippets below. For a more comprehensive example, see the [Interacting with Custom Contracts](../start/hello-contract-remote-node.md#interacting-with-custom-contracts) section of the Deploy a Contract code example.

```typescript
let contract = new kit.web3.eth.Contract(ABI, address)       // Init a web3.js contract instance
let name = await instance.methods.getName().call()       // Read contract state call

const txObject = await instance.methods.setName(newName) // Encoding a transaction object call to the contract
await kit.sendTransactionObject(txObject, { from: account.address }) // Send the transaction
```

## Selling CELO only if the rate is favorable

```typescript
// This is at lower price I will accept in cUSD for every CELO
const favorableAmount = 100
const amountToExchange = kit.web3.utils.toWei('10', 'ether')
const oneGold = kit.web3.utils.toWei('1', 'ether')
const exchange = await kit.contracts.getExchange()

const amountOfcUsd = await exchange.quoteGoldSell(oneGold)

if (amountOfcUsd > favorableAmount) {
  const goldToken = await kit.contracts.getGoldToken()
  const approveTx = await goldToken.approve(exchange.address, amountToExchange).send()
  const approveReceipt = await approveTx.waitReceipt()

  const usdAmount = await exchange.quoteGoldSell(amountToExchange)
  const sellTx = await exchange.sellGold(amountToExchange, usdAmount).send()
  const sellReceipt = await sellTx.waitReceipt()
}
```

## Buying all the CELO I can, with the cUSD in my account

```typescript
const stableToken = await this.contracts.getStableToken()
const exchange = await this.contracts.getExchange()

const cUsdBalance = await stableToken.balanceOf(myAddress)

const approveTx = await stableToken.approve(exchange.address, cUsdBalance).send()
const approveReceipt = await approveTx.waitReceipt()

const goldAmount = await exchange.quoteUsdSell(cUsdBalance)
const sellTx = await exchange.sellDollar(cUsdBalance, goldAmount).send()
const sellReceipt = await sellTx.waitReceipt()
```

