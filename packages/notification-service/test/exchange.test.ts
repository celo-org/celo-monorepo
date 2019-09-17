import { CURRENCY_ENUM } from '@celo/utils'
import Web3 from 'web3'
import { getExchangeRate, getWeb3Instance } from '../src/exchange/exchangeQuery'

describe('getExchangeRate', () => {
  let web3: Web3
  let dollarMakerRate: number
  let goldMakerRate: number
  it('should fetch a working web3 instance', async () => {
    web3 = await getWeb3Instance()
    expect(await web3.eth.net.isListening()).toBeTruthy()
  })
  it('should fetch a positive dollar maker rate', async () => {
    dollarMakerRate = Number(await getExchangeRate(CURRENCY_ENUM.DOLLAR, web3))
    expect(dollarMakerRate).toBeGreaterThan(0)
  })
  it('should fetch a positive gold maker rate', async () => {
    goldMakerRate = Number(await getExchangeRate(CURRENCY_ENUM.GOLD, web3))
    expect(goldMakerRate).toBeGreaterThan(0)
  })
  it('should have rates within a 10% spread', async () => {
    const spread = dollarMakerRate * goldMakerRate
    expect(spread).toBeGreaterThan(0.9)
    expect(spread).toBeLessThan(1.1)
  })
})
