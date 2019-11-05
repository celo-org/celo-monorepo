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

const mockHttpCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
}

describe('Currency Conversion', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    currencyConversionAPI = new CurrencyConversionAPI()
    currencyConversionAPI.initialize({ context: {}, cache: mockHttpCache })
    jest.clearAllMocks()
  })

  it('should retrieve exchange rates for given currency', async () => {
    const result = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result).toMatchObject({ rate: 20 })
    expect(fetchMock.mock.calls.length).toEqual(1)
  })

  it('should retrieve exchange rates from cache', async () => {
    // mockHttpCache.get.mockImplementation(() =>
    //   JSON.stringify({
    //     policy: CachePolicy(),
    //     ttlOverride: 0,
    //     body: SUCCESS_RESULT,
    //   })
    // )
    const result1 = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result1).toMatchObject({ rate: 20 })
    expect(fetchMock.mock.calls.length).toEqual(1)
    const result2 = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result2).toMatchObject({ rate: 20 })
    expect(fetchMock.mock.calls.length).toEqual(1)
  })
})
