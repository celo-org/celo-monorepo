import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { ExchangeWrapper } from './Exchange'
import { StableTokenWrapper } from './StableTokenWrapper'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

testWithGanache('Exchange Wrapper', (web3) => {
  const ONE = web3.utils.toWei('1', 'ether')

  const LARGE_BUY_AMOUNT = web3.utils.toWei('1000', 'ether')

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let exchange: ExchangeWrapper
  let stableToken: StableTokenWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    exchange = await kit.contracts.getExchange()
    stableToken = await kit.contracts.getStableToken()
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
      const usdAmount = (await exchange.quoteGoldBuy(ONE)).toString()
      await stableToken
        .approve(exchange.address, usdAmount)
        .sendAndWaitForReceipt({ from: accounts[0] })
      const result = await exchange
        .buy(ONE, usdAmount, true)
        .sendAndWaitForReceipt({ from: accounts[0] })
      expect(result.events?.Exchanged).toBeDefined()
      expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
      expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
    })
  })

  test('SBAT quoteUsdSell', () => expect(exchange.quoteUsdSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldSell', () => expect(exchange.quoteGoldSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteUsdBuy', () => expect(exchange.quoteUsdBuy(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldBuy', () => expect(exchange.quoteGoldBuy(ONE)).resolves.toBeBigNumber())

  test('SBAT sellDollar', async () => {
    const goldAmount = await exchange.quoteUsdSell(ONE)
    const approveTx = await stableToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellDollar(ONE, goldAmount).send()
    const result = await sellTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
  })

  test('SBAT sellGold', async () => {
    const usdAmount = await exchange.quoteGoldSell(ONE)
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellGold(ONE, usdAmount).send()
    const result = await sellTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(true)
  })

  test('SBAT buyDollar', async () => {
    const goldAmount = await exchange.quoteUsdBuy(ONE)
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, goldAmount.toString()).send()
    await approveTx.waitReceipt()
    const buyTx = await exchange.buyDollar(ONE, goldAmount).send()
    const result = await buyTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(true)
  })

  test('SBAT buyGold', async () => {
    const usdAmount = await exchange.quoteGoldBuy(ONE)
    const approveTx = await stableToken.approve(exchange.address, usdAmount.toString()).send()
    await approveTx.waitReceipt()
    const buyTx = await exchange.buyGold(ONE, usdAmount).send()
    const result = await buyTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
  })

  test('SBAT getExchangeRate for selling gold', async () => {
    const sellGoldRate = await exchange.getExchangeRate(LARGE_BUY_AMOUNT, true)
    expect(sellGoldRate.toNumber()).toBeGreaterThan(0)
  })

  test('SBAT getExchangeRate for selling dollars', async () => {
    const sellGoldRate = await exchange.getUsdExchangeRate(LARGE_BUY_AMOUNT)
    expect(sellGoldRate.toNumber()).toBeGreaterThan(0)
  })
})
