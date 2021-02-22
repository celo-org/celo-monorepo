import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { BaseExchangeWrapper } from './BaseExchange'
import { BaseStableTokenWrapper } from './BaseStableTokenWrapper'
import { Exchange } from '../generated/Exchange'
import { StableToken } from '../generated/StableToken'

/*
TEST NOTES:
- In migrations: The only account that has a stable balance is accounts[0]
*/

export function testExchange<E extends Exchange, ST extends StableToken>(
  web3: Web3,
  exchangeGetter: () => Promise<BaseExchangeWrapper<E>>,
  stableTokenGetter: () => Promise<BaseStableTokenWrapper<ST>>
) {
  const ONE = web3.utils.toWei('1', 'ether')

  const LARGE_BUY_AMOUNT = web3.utils.toWei('1000', 'ether')

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let exchange: BaseExchangeWrapper<E>
  let stableToken: BaseStableTokenWrapper<ST>

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    exchange = await exchangeGetter()
    stableToken = await stableTokenGetter()
  })

  test('SBAT check buckets', async () => {
    const [buyBucket, sellBucket] = await exchange.getBuyAndSellBuckets(true)
    expect(buyBucket).toBeBigNumber()
    expect(sellBucket).toBeBigNumber()
    expect(buyBucket.toNumber()).toBeGreaterThan(0)
    expect(sellBucket.toNumber()).toBeGreaterThan(0)
  })

  describe('#exchange', () => {
    test('executes successfully', async () => {
      const minBuyAmount = '100'
      await stableToken.approve(exchange.address, ONE).sendAndWaitForReceipt({ from: accounts[0] })
      const result = await exchange
        .exchange(ONE, minBuyAmount, false)
        .sendAndWaitForReceipt({ from: accounts[0] })
      expect(result.events?.Exchanged).toBeDefined()
      expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    })
  })

  describe('#sell', () => {
    test('executes successfully', async () => {
      const minBuyAmount = '100'
      await stableToken.approve(exchange.address, ONE).sendAndWaitForReceipt({ from: accounts[0] })
      const result = await exchange
        .sell(ONE, minBuyAmount, false)
        .sendAndWaitForReceipt({ from: accounts[0] })
      expect(result.events?.Exchanged).toBeDefined()
      expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    })
  })

  describe('#buy', () => {
    test('executes successfully', async () => {
      const stableAmount = (await exchange.quoteGoldBuy(ONE)).toString()
      await stableToken
        .approve(exchange.address, stableAmount)
        .sendAndWaitForReceipt({ from: accounts[0] })
      const result = await exchange
        .buy(ONE, stableAmount, true)
        .sendAndWaitForReceipt({ from: accounts[0] })
      expect(result.events?.Exchanged).toBeDefined()
      expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
      expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
    })
  })

  test('SBAT quoteStableSell', () => expect(exchange.quoteStableSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldSell', () => expect(exchange.quoteGoldSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteStableBuy', () => expect(exchange.quoteStableBuy(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldBuy', () => expect(exchange.quoteGoldBuy(ONE)).resolves.toBeBigNumber())

  test('SBAT sellStable', async () => {
    const goldAmount = await exchange.quoteStableSell(ONE)
    const approveTx = await stableToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellStable(ONE, goldAmount).send()
    const result = await sellTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
  })

  test('SBAT sellGold', async () => {
    const stableAmount = await exchange.quoteGoldSell(ONE)
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellGold(ONE, stableAmount).send()
    const result = await sellTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(true)
  })

  test('SBAT buyStable', async () => {
    const goldAmount = await exchange.quoteStableBuy(ONE)
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, goldAmount.toString()).send()
    await approveTx.waitReceipt()
    const buyTx = await exchange.buyStable(ONE, goldAmount).send()
    const result = await buyTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(true)
  })

  test('SBAT buyGold', async () => {
    const stableAmount = await exchange.quoteGoldBuy(ONE)
    const approveTx = await stableToken.approve(exchange.address, stableAmount.toString()).send()
    await approveTx.waitReceipt()
    const buyTx = await exchange.buyGold(ONE, stableAmount).send()
    const result = await buyTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
  })

  test('SBAT getExchangeRate for selling gold', async () => {
    const sellGoldRate = await exchange.getExchangeRate(LARGE_BUY_AMOUNT, true)
    expect(sellGoldRate.toNumber()).toBeGreaterThan(0)
  })

  test('SBAT getExchangeRate for selling stables', async () => {
    const sellGoldRate = await exchange.getStableExchangeRate(LARGE_BUY_AMOUNT)
    expect(sellGoldRate.toNumber()).toBeGreaterThan(0)
  })
}

testWithGanache('Base Exchange', () => {
  test('empty', () => {
    // This is intentionally empty
  })
})
