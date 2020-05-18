# ContractKit Usage

The following are some examples of the capabilities of the `ContractKit`, assuming it is already connected to a node. If you aren't connected, [here is a refresher.](../walkthroughs/hellocontracts.md#deploy-to-alfajores)

## Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { CeloContract } from '@celo/contractkit'

let accounts = await kit.web3.eth.getAccounts()
kit.defaultAccount = accounts[0]
// paid gas in cUSD
await kit.setFeeCurrency(CeloContract.StableToken)
```

## Getting the Total Balance

This method from the `kit` will return the cGLD, locked cGLD, cUSD and total balance of the address

```ts
let totalBalance = await kit.getTotalBalance(myAddress)
```

## Deploy a contract

Deploying a contract with the default account already set. Simply send a transaction with no `to:` field. See more about [sending custom transactions](https://docs.celo.org/developer-guide/overview/introduction/contractkit/contracts-wrappers-registry#sending-custom-transactions). 

You can verify the deployment on the [Alfajores block explorer here](https://alfajores-blockscout.celo-testnet.org/). Wait for the receipt and log it to get the transaction details.

```ts
let bytecode = '0x608060405234...' // compiled Solidity deployment bytecode

let tx = await kit.sendTransaction({
    data: bytecode
})

let receipt = tx.waitReceipt()
console.log(receipt)
```

## Selling cGLD only if the rate is favorable

```ts
// This is at lower price I will accept in cUSD for every cGLD
const favorableAmout = 100
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

## Buying all the cGLD I can, with the cUSD in my account

```ts
const stableToken = await this.contracts.getStableToken()
const exchange = await this.contracts.getExchange()

const cUsdBalance = await stableToken.balanceOf(myAddress)

const approveTx = await stableToken.approve(exchange.address, cUsdBalance).send()
const approveReceipt = await approveTx.waitReceipt()

const goldAmount = await exchange.quoteUsdSell(cUsdBalance)
const sellTx = await exchange.sellDollar(cUsdBalance, goldAmount).send()
const sellReceipt = await sellTx.waitReceipt()
```
