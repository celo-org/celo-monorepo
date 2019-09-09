import { CurrencyConversionAPI } from '../src/currencyConversion'

const mockDataSourceGet = jest.fn(() => ({
  rates: {
    MXN: 20,
  },
  base: 'USD',
  date: '2019-09-04',
}))

jest.mock('apollo-datasource-rest', () => {
  class MockRESTDataSource {
    baseUrl = ''
    get = mockDataSourceGet
  }

  return {
    RESTDataSource: MockRESTDataSource,
  }
})

describe('Currency Conversion', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    currencyConversionAPI = new CurrencyConversionAPI()
    mockDataSourceGet.mockClear()
  })

  it('should retrieve exchange rates for given currency', async () => {
    const result = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result).toMatchObject({ rate: 20 })
    expect(mockDataSourceGet).toHaveBeenCalledTimes(1)
  })

  it('should retrieve exchange rates from cache', async () => {
    const result1 = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result1).toMatchObject({ rate: 20 })
    expect(mockDataSourceGet).toHaveBeenCalledTimes(1)
    const result2 = await currencyConversionAPI.getExchangeRate({ currencyCode: 'MXN' })
    expect(result2).toMatchObject({ rate: 20 })
    expect(mockDataSourceGet).toHaveBeenCalledTimes(1)
  })
})
