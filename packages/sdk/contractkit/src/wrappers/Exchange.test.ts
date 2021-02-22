import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { testExchange } from './BaseExchange.test'
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

  testExchange(
    kit,
    kit.contracts.getExchange.bind(kit.contracts),
    kit.contracts.getStableToken.bind(kit.contracts)
  )

  test('SBAT use quoteUsdSell as an alias for quoteStableSell', () =>
    expect(exchange.quoteUsdSell(ONE)).resolves.toBeBigNumber())

  test('SBAT use quoteUsdBuy as an alias for quoteStableBuy', () =>
    expect(exchange.quoteUsdBuy(ONE)).resolves.toBeBigNumber())

  test('SBAT use sellDollar as an alias for sellStable', async () => {
    const goldAmount = await exchange.quoteUsdSell(ONE)
    const approveTx = await stableToken.approve(exchange.address, ONE).send()
    await approveTx.waitReceipt()
    const sellTx = await exchange.sellDollar(ONE, goldAmount).send()
    const result = await sellTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.sellAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(false)
  })

  test('SBAT use buyDollar as an alias for buyStable', async () => {
    const goldAmount = await exchange.quoteStableBuy(ONE)
    const goldToken = await kit.contracts.getGoldToken()
    const approveTx = await goldToken.approve(exchange.address, goldAmount.toString()).send()
    await approveTx.waitReceipt()
    const buyTx = await exchange.buyDollar(ONE, goldAmount).send()
    const result = await buyTx.waitReceipt()
    expect(result.events?.Exchanged).toBeDefined()
    expect(result.events?.Exchanged.returnValues.buyAmount).toBe(ONE)
    expect(result.events?.Exchanged.returnValues.soldGold).toBe(true)
  })

  test('SBAT use getUsdExchangeRate as an alias for getStableExchangeRate', async () => {
    const sellGoldRate = await exchange.getUsdExchangeRate(LARGE_BUY_AMOUNT)
    expect(sellGoldRate.toNumber()).toBeGreaterThan(0)
  })
})
