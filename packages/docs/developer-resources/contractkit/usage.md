# ContractKit Usage

The following are some examples of the capabilities of the `ContractKit`

## Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { CeloContract } from '@celo/contractkit'

// default from
kit.defaultAccount = myAddress
// paid gas in cUSD
await kit.setFeeCurrency(CeloContract.StableToken)
```

## Getting the Total Balance

This method from the `kit` will return the cGLD, locked cGLD, cUSD and total balance of the address 

```ts
await kit.getTotalBalance(myAddress)
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
