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
    ATTESTATIONS_ADDRESS: '0x0000000000000000000000000000000000a77357',
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

    // Reversing for convinience to match the order in mock data
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
})
