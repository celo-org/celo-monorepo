import BigNumber from 'bignumber.js'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import {
  getNewMakerBalance,
  getNewTakerBalance,
  getRateForMakerToken,
  getTakerAmount,
} from 'src/utils/currencyExchange'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

describe('getRateForMakerToken', () => {
  it('when DOLLAR returns exchange rate', () => {
    expect(getRateForMakerToken(exchangeRatePair, CURRENCY_ENUM.DOLLAR)).toEqual(
      new BigNumber('10')
    )
  })

  it('when GOLD returns exchange rate based on direction', () => {
    expect(getRateForMakerToken(exchangeRatePair, CURRENCY_ENUM.GOLD)).toEqual(
      new BigNumber('0.11')
    )
  })
  it('when empty rate it does not crash', () => {
    expect(getRateForMakerToken(null, CURRENCY_ENUM.GOLD)).toEqual(new BigNumber('0'))
  })
})

describe('getTakerAmount', () => {
  it('converts the maker currency into taker currency', () => {
    expect(getTakerAmount(new BigNumber('33'), exchangeRatePair.dollarMaker)).toEqual(
      new BigNumber('3.3')
    )
  })
  it('returns 0 if receives a null', () => {
    expect(getTakerAmount(null, new BigNumber(0.5))).toEqual(new BigNumber('0'))
  })
  it('when garbage rate it does not crash', () => {
    expect(getTakerAmount('hello', 'goodbye')).toEqual(new BigNumber('0'))
  })
  it('rounds correctly', () => {
    expect(getTakerAmount(20, 0.11, 0)).toEqual(new BigNumber(181))
    expect(getTakerAmount(20, 0.11, 2)).toEqual(new BigNumber(181.81))
  })
})

describe('getNewMakerBalance', () => {
  it('currently sums the amounts', () => {
    expect(getNewMakerBalance('2000', new BigNumber(20))).toEqual('1,980.00')
  })
})

describe('getNewTakerBalance', () => {
  it('currently sums the amounts', () => {
    expect(getNewTakerBalance('2000', new BigNumber(20))).toEqual('2,020.00')
  })
})
