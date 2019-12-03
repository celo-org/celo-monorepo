import { InMemoryLRUCache } from 'apollo-server-caching'
import BigNumber from 'bignumber.js'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'

const MOCK_DATA = {
  '-Lv5oAJU8dDHVfqXlKkE': {
    exchangeRate: '10.1',
    pair: 'cGLD/cUSD',
    timestamp: 1575293596846,
  },
  '-Lv5oAJVzoRhZw3fiViQ': {
    exchangeRate: '0.1',
    pair: 'cUSD/cGLD',
    timestamp: 1575293596846,
  },
  '-Lv5qbL_oSvKQ_452ZHh': {
    exchangeRate: '10.2',
    pair: 'cGLD/cUSD',
    timestamp: 1575294235753,
  },
  '-Lv5qbLcXmDPMJC5bnSk': {
    exchangeRate: '0.2',
    pair: 'cUSD/cGLD',
    timestamp: 1575294235753,
  },
  '-Lv5rRCAOhPJJqVmLiID': {
    exchangeRate: '10.3',
    pair: 'cGLD/cUSD',
    timestamp: 1575294452181,
  },
  '-Lv5rRCDdh-73eP0jArN': {
    exchangeRate: '0.3',
    pair: 'cUSD/cGLD',
    timestamp: 1575294452181,
  },
}

const snapshot = { val: () => MOCK_DATA, exists: jest.fn(() => true) }

const mockOnce = jest.fn(() => snapshot)

const mockQuery = jest.fn(() => ({
  startAt: jest.fn().mockReturnThis(),
  endAt: jest.fn().mockReturnThis(),
  once: mockOnce,
}))

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  database: () => ({
    ref: jest.fn((path) => ({
      orderByChild: mockQuery,
    })),
  }),
}))

describe('GoldExchangeRateAPI', () => {
  let goldExchangeRateAPI: GoldExchangeRateAPI

  beforeEach(() => {
    goldExchangeRateAPI = new GoldExchangeRateAPI()
    goldExchangeRateAPI.initialize({ context: {}, cache: new InMemoryLRUCache() })
    jest.clearAllMocks()
  })

  it('should retrieve the closest exchange rate for cGLD/cUSD', async () => {
    const result = await goldExchangeRateAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'cUSD',
      timestamp: 1575294235653,
    })
    expect(result).toEqual(new BigNumber(10.2))
    expect(mockOnce).toHaveBeenCalledTimes(1)
  })

  it('should retrieve the closest exchange rate for cUSD/cGLD', async () => {
    const result = await goldExchangeRateAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'cGLD',
      timestamp: 1575294235653,
    })
    expect(result).toEqual(new BigNumber(0.2))
    expect(mockOnce).toHaveBeenCalledTimes(1)
  })

  it('should throw when requesting an invalid currency code', async () => {
    await expect(
      goldExchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: 'cUSD',
        currencyCode: 'ABC',
        timestamp: 1575294235653,
      })
    ).rejects.toThrow('No matching data for cUSD/ABC')
    expect(mockOnce).toHaveBeenCalledTimes(1)
  })
})
