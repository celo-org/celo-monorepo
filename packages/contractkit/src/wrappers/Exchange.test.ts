import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import { ExchangeWrapper } from './Exchange'

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

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    exchange = await kit.contracts.getExchange()
  })

  test('SBAT check buckets', async () => {
    const [buyBucket, sellBucket] = await exchange.getBuyAndSellBuckets(true)
    expect(buyBucket).toBeBigNumber()
    expect(sellBucket).toBeBigNumber()
    expect(buyBucket.toNumber()).toBeGreaterThan(0)
    expect(sellBucket.toNumber()).toBeGreaterThan(0)
  })

  test('SBAT quoteUsdSell', () => expect(exchange.quoteUsdSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldSell', () => expect(exchange.quoteGoldSell(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteUsdBuy', () => expect(exchange.quoteUsdBuy(ONE)).resolves.toBeBigNumber())
  test('SBAT quoteGoldBuy', () => expect(exchange.quoteGoldBuy(ONE)).resolves.toBeBigNumber())

  test('SBAT sellDollar', async () => {
    const goldAmount = await exchange.quoteUsdSell(ONE)

    const stableToken = await kit.contracts.getStableToken()
    const approveTx = await stableToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellDollar(ONE, goldAmount).send()
    await sellTx.waitReceipt()
  })

  test('SBAT sellGold', async () => {
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()

    const usdAmount = await exchange.quoteGoldSell(ONE)
    const sellTx = await exchange.sellGold(ONE, usdAmount).send()
    await sellTx.waitReceipt()
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
