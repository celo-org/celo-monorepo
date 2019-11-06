import { InMemoryLRUCache } from 'apollo-server-caching'
import { FetchMock } from 'jest-fetch-mock'
import { CurrencyConversionAPI } from '../src/currencyConversion'

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

describe('Currency Conversion', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    currencyConversionAPI = new CurrencyConversionAPI()
    currencyConversionAPI.initialize({ context: {}, cache: new InMemoryLRUCache() })
    jest.clearAllMocks()
  })

  it('should retrieve exchange rates for given currency', async () => {
    const result = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result).toMatchObject({ rate: 20 })
    expect(fetchMock.mock.calls.length).toEqual(1)
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

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result1 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result1).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours - 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 - 1))

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result2 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result2).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours + 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 + 1))

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result3 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result3).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('should cache rates for previous days indefinitely', async () => {
      const cache = new InMemoryLRUCache()
      const now = Date.now() - 24 * 3600 * 1000

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result1 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result1).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours - 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 - 1))

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result2 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result2).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +12 hours + 1 millisecond
      Date.now = jest.fn(() => now + (12 * 3600 * 1000 + 1))

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result3 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result3).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Advance date to +10 years
      Date.now = jest.fn(() => now + 10 * 365 * 24 * 3600 * 1000)

      currencyConversionAPI = new CurrencyConversionAPI()
      currencyConversionAPI.initialize({ context: {}, cache })
      const result4 = await currencyConversionAPI.getExchangeRate({
        currencyCode: 'MXN',
        timestamp: now,
      })
      expect(result4).toMatchObject({ rate: 20 })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
