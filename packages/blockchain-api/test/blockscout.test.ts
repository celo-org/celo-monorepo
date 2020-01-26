import { BlockscoutAPI } from '../src/blockscout'
import mockTokenTxs from './mockTokenTxs'

const mockDataSourceGet = jest.fn(() => mockTokenTxs)

jest.mock('apollo-datasource-rest', () => {
  class MockRESTDataSource {
    baseUrl = ''
    get = mockDataSourceGet
  }

  return {
    RESTDataSource: MockRESTDataSource,
  }
})

jest.mock('../src/config.ts', () => {
  return {
    ...jest.requireActual('../src/config.ts'),
    FAUCET_ADDRESS: '0x0000000000000000000000000000000000f40c37',
  }
})

jest.mock('../src/utils.ts', () => {
  const contractGetter = jest.fn()
  const tokenAddressMapping: { [key: string]: string } = {
    ['0x000000000000000000000000000000000000gold']: 'Celo Gold',
    ['0x0000000000000000000000000000000000dollar']: 'Celo Dollar',
  }
  contractGetter.mockReturnValue({
    tokenAddressMapping,
    attestationsAddress: '0x0000000000000000000000000000000000a77357',
    escrowAddress: '0x0000000000000000000000000000000000a77327',
  })
  return {
    ...jest.requireActual('../src/utils.ts'),
    getContractAddresses: contractGetter,
  }
})

describe('Blockscout', () => {
  let blockscoutAPI: BlockscoutAPI

  beforeEach(() => {
    blockscoutAPI = new BlockscoutAPI()
    mockDataSourceGet.mockClear()
  })

  it('should get feed events and label them properly', async () => {
    const result = await blockscoutAPI.getFeedEvents({
      address: '0x0000000000000000000000000000000000007E57',
    })

    // Reversing for convenience to match the order in mock data
    const events = result.reverse()

    expect(events).toHaveLength(mockTokenTxs.result.length - 1)

    expect(events[0]).toMatchObject({
      type: 'EXCHANGE',
      timestamp: 1566345866,
      block: 90637,
      inSymbol: 'Celo Gold',
      inValue: 10,
      outSymbol: 'Celo Dollar',
      outValue: 10,
      hash: '0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2',
    })

    expect(events[1]).toMatchObject({
      type: 'SENT',
      timestamp: 1566346276,
      block: 90719,
      value: 0.15,
      address: '0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811',
      comment: '',
      symbol: 'Celo Dollar',
      hash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb',
    })

    expect(events[2]).toMatchObject({
      type: 'RECEIVED',
      timestamp: 1566479946,
      block: 117453,
      value: 10,
      address: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      comment: '',
      symbol: 'Celo Dollar',
      hash: '0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536',
    })

    expect(events[3]).toMatchObject({
      type: 'SENT',
      timestamp: 1566481000,
      block: 117451,
      value: 1,
      address: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      comment: '',
      symbol: 'Celo Gold',
      hash: '0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be',
    })

    expect(events[4]).toMatchObject({
      type: 'RECEIVED',
      timestamp: 1566482000,
      block: 117451,
      value: 10,
      address: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      comment: '',
      symbol: 'Celo Gold',
      hash: '0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605',
    })

    expect(events[5]).toMatchObject({
      type: 'FAUCET',
      timestamp: 1566483000,
      block: 117451,
      value: 5,
      address: '0x0000000000000000000000000000000000f40c37',
      comment: '',
      symbol: 'Celo Gold',
      hash: '0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09',
    })

    expect(events[6]).toMatchObject({
      type: 'VERIFICATION_FEE',
      timestamp: 1566484000,
      block: 117451,
      value: 0.2,
      address: '0x0000000000000000000000000000000000a77357',
      comment: '',
      symbol: 'Celo Gold',
      hash: '0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160',
    })
  })

  it('should get dollar transactions and label them properly', async () => {
    const result = await blockscoutAPI.getTokenTransactions({
      address: '0x0000000000000000000000000000000000007E57',
      token: 'cUSD',
      localCurrencyCode: 'MXN',
    })

    // Reversing for convenience to match the order in mock data
    const transactions = result.reverse()

    expect(transactions).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566345866000,
            "value": "10",
          },
          "block": "90637",
          "hash": "0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2",
          "makerAmount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566345866000,
            "value": "10",
          },
          "takerAmount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566345866000,
            "value": "10",
          },
          "timestamp": 1566345866000,
          "type": "EXCHANGE",
        },
        Object {
          "address": "0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566346276000,
            "value": "-0.15",
          },
          "block": "90719",
          "comment": "",
          "hash": "0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb",
          "timestamp": 1566346276000,
          "type": "SENT",
        },
        Object {
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566479946000,
            "value": "10",
          },
          "block": "117453",
          "comment": "",
          "hash": "0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536",
          "timestamp": 1566479946000,
          "type": "RECEIVED",
        },
        Object {
          "address": "0x0000000000000000000000000000000000a77357",
          "amount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566484000000,
            "value": "-0.2",
          },
          "block": "117451",
          "comment": "",
          "hash": "0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160",
          "timestamp": 1566484000000,
          "type": "VERIFICATION_FEE",
        },
      ]
    `)
  })

  it('should get gold transactions and label them properly', async () => {
    const result = await blockscoutAPI.getTokenTransactions({
      address: '0x0000000000000000000000000000000000007E57',
      token: 'cGLD',
      localCurrencyCode: 'MXN',
    })

    // Reversing for convenience to match the order in mock data
    const transactions = result.reverse()

    expect(transactions).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566345866000,
            "value": "-10",
          },
          "block": "90637",
          "hash": "0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2",
          "makerAmount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566345866000,
            "value": "10",
          },
          "takerAmount": Object {
            "currencyCode": "cUSD",
            "timestamp": 1566345866000,
            "value": "10",
          },
          "timestamp": 1566345866000,
          "type": "EXCHANGE",
        },
        Object {
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566481000000,
            "value": "-1",
          },
          "block": "117451",
          "comment": "",
          "hash": "0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be",
          "timestamp": 1566481000000,
          "type": "SENT",
        },
        Object {
          "address": "0xf4314cb9046bece6aa54bb9533155434d0c76909",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566482000000,
            "value": "10",
          },
          "block": "117451",
          "comment": "",
          "hash": "0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605",
          "timestamp": 1566482000000,
          "type": "RECEIVED",
        },
        Object {
          "address": "0x0000000000000000000000000000000000f40c37",
          "amount": Object {
            "currencyCode": "cGLD",
            "timestamp": 1566483000000,
            "value": "5",
          },
          "block": "117451",
          "comment": "",
          "hash": "0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09",
          "timestamp": 1566483000000,
          "type": "FAUCET",
        },
      ]
    `)
  })
})
