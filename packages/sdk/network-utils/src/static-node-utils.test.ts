import { StaticNodeUtils } from './static-node-utils'
import { _testSetTimezoneOverride } from './utils/timezone'

const testEndpoint = (network: string) =>
  `https://www.googleapis.com/storage/v1/b/static_nodes/o/${network}?alt=media`

const mockStaticNodes = [
  'enode://e99a883d0b7d0bacb84cde98c4729933b49adbc94e718b77fdb31779c7ed9da6c49236330a9ae096f42bcbf6e803394229120201704b7a4a3ae8004993fa0876@34.83.92.243:30303',
  'enode://b3b42a9a6ef1125006f39b95850c624422eadb6340ac86e4023e47d5452914bb3d17340f9455cd1cdd0d246058b1fec2d3c500eeddbeafa49abd71f8f144b04e@35.199.145.251:30303',
  'enode://af5677afe5bf99a00bdb86d0f80f948b2e25f8978867b38cba8e860a6426507cbc37e15900f798305ceff6b7ac7f4057195827274d6b5f6a7e547ce512ff26ba@35.230.21.97:30303',
]

describe('StaticNodeUtils', () => {
  describe('StaticNodeUtils.getStaticNodesAsync', () => {
    afterEach(() => {
      fetchMock.reset()
      _testSetTimezoneOverride(undefined)
    })

    it('should fetch static nodes for alfajores', async () => {
      fetchMock.mock(testEndpoint('alfajores'), mockStaticNodes)
      const nodes = await StaticNodeUtils.getStaticNodesAsync('alfajores')
      // Expect that the mocked data was returned.
      expect(JSON.parse(nodes)).toEqual(mockStaticNodes)
    })

    it('should fail to fetch static nodes for an invalid network', async () => {
      fetchMock.mock(testEndpoint('churro'), 404)
      await expect(StaticNodeUtils.getStaticNodesAsync('churro')).rejects.toEqual(new Error())
    })
  })

  describe('StaticNodeUtils.getRegionalStaticNodesAsync', () => {
    afterEach(() => {
      fetchMock.reset()
      _testSetTimezoneOverride(undefined)
    })

    it('should retrieve the correct mainnet static nodes file based on the region', async () => {
      _testSetTimezoneOverride('Asia/Jakarta')
      fetchMock.mock(testEndpoint('mainnet.gcp-asia-east1'), mockStaticNodes)
      const nodes = await StaticNodeUtils.getRegionalStaticNodesAsync('mainnet')
      // Expect that the mocked data was returned.
      expect(JSON.parse(nodes)).toEqual(mockStaticNodes)
    })

    it('should retrieve the default alfajores static nodes file', async () => {
      _testSetTimezoneOverride('Asia/Jakarta')
      fetchMock.mock(testEndpoint('alfajores'), mockStaticNodes)
      const nodes = await StaticNodeUtils.getRegionalStaticNodesAsync('alfajores')
      // Expect that the mocked data was returned.
      expect(JSON.parse(nodes)).toEqual(mockStaticNodes)
    })

    it('should fail to retrieve the correct mainnet static nodes file if the region is not available', async () => {
      _testSetTimezoneOverride('Asia/Jakarta')
      fetchMock.mock(testEndpoint('mainnet.gcp-asia-east1'), 404)
      await expect(StaticNodeUtils.getRegionalStaticNodesAsync('mainnet')).rejects.toEqual(
        new Error()
      )
    })
  })

  describe('StaticNodeUtils.getStaticNodeRegion', () => {
    const cases = [
      {
        timezone: 'America/Chicago',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'America/New_York',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'America/Los_Angeles',
        region: 'gcp-us-west1',
      },
      {
        timezone: 'Europe/Istanbul',
        region: 'gcp-europe-west1',
      },
      {
        timezone: 'America/El_Salvador',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'Europe/Lisbon',
        region: 'gcp-europe-west1',
      },
      {
        timezone: 'Europe/Oslo',
        region: 'gcp-europe-west1',
      },
      {
        timezone: 'America/Mexico_City',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'Africa/Nairobi',
        region: 'gcp-europe-west1',
      },
      {
        timezone: 'Africa/Kampala',
        region: 'gcp-europe-west1',
      },
      {
        timezone: 'America/Argentina/Buenos_Aires',
        region: 'gcp-southamerica-east1',
      },
      {
        timezone: 'America/Sao_Paulo',
        region: 'gcp-southamerica-east1',
      },
      {
        timezone: 'America/Bogota',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'America/Costa_Rica',
        region: 'gcp-us-east1',
      },
      {
        timezone: 'Asia/Hong_Kong',
        region: 'gcp-asia-east1',
      },
      {
        timezone: 'Asia/Jakarta',
        region: 'gcp-asia-east1',
      },
      {
        timezone: 'Australia/Melbourne',
        region: 'gcp-asia-east1',
      },
      {
        timezone: 'Etc', // Virtual timezone that does not denote location.
        region: '',
      },
      {
        timezone: 'Oz/Emerald_City', // Not a real timezone
        region: '',
      },
    ]

    afterEach(() => {
      _testSetTimezoneOverride(undefined)
    })

    for (const { timezone, region } of cases) {
      it(`should select the best mainnet region for ${timezone}`, () => {
        _testSetTimezoneOverride(timezone)
        expect(StaticNodeUtils.getStaticNodeRegion('mainnet')).toEqual(region)
        expect(StaticNodeUtils.getStaticNodeRegion('rc1')).toEqual(region)
      })
    }

    it(`should always select the region based on given timezone when provided`, () => {
      for (const { timezone, region } of cases) {
        _testSetTimezoneOverride('Unknown')
        expect(StaticNodeUtils.getStaticNodeRegion('mainnet', timezone)).toEqual(region)
      }
    })

    it(`should always select the default baklava region`, () => {
      for (const { timezone } of cases) {
        _testSetTimezoneOverride(timezone)
        expect(StaticNodeUtils.getStaticNodeRegion('baklava')).toEqual('')
      }
    })
  })
})
