import { InMemoryLRUCache } from 'apollo-server-caching'
import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock'
import ExchangeRateAPI from './ExchangeRateAPI'

const mockFetch = fetch as FetchMock

const SUCCESS_RESULT = JSON.stringify({
  success: true,
  date: '2005-02-01',
  timestamp: 1107302399,
  source: 'USD',
  quotes: {
    USDMXN: 20,
  },
})

mockFetch.mockResponse(SUCCESS_RESULT, {
  status: 200,
  headers: {
    'Content-type': 'application/json',
  },
})

describe('ExchangeRateAPI', () => {
  let exchangeRateAPI: ExchangeRateAPI

  beforeEach(() => {
    exchangeRateAPI = new ExchangeRateAPI()
    exchangeRateAPI.initialize({ context: {}, cache: new InMemoryLRUCache() })
    jest.clearAllMocks()
  })

  it('should retrieve exchange rates for given currency', async () => {
    const result = await exchangeRateAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result).toEqual(new BigNumber(20))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('should throw when requesting an invalid currency code', async () => {
    await expect(
      exchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: 'USD',
        currencyCode: 'ABC',
      })
    ).rejects.toThrow('No matching data for USD/ABC')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  describe('caching', () => {
    const originalNow = Date.now

    beforeEach(() => {
      const now = Date.now()
      Date.now = jest.fn(() => now)
    })

    afterEach(() => {
      Date.now = originalNow
    })

    it('should cache rates for the current day for 12 hours', async () => {
      const cache = new InMemoryLRUCache()
      const now = Date.now()

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result1 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result1).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours - 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 - 1))

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result2 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result2).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours + 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 + 1))

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result3 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result3).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('should cache rates for previous days indefinitely', async () => {
      const cache = new InMemoryLRUCache()
      const now = Date.now() - 24 * 3600 * 1000

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result1 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result1).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours - 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 - 1))

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result2 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result2).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours + 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 + 1))

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result3 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result3).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +10 years
      Date.now = jest.fn(() => now + 10 * 365 * 24 * 3600 * 1000)

      exchangeRateAPI = new ExchangeRateAPI()
      exchangeRateAPI.initialize({ context: {}, cache })
      const result4 = await exchangeRateAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result4).toEqual(new BigNumber(20))
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
