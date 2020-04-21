import { BLINDBLS } from 'bls12377js-blind'
import config from '../../src/config'
import { BLSCryptographyClient } from '../../src/salt-generation/bls-cryptography-client'

// Env var should hold service principal credentials
// https://www.npmjs.com/package/@azure/keyvault-keys
require('dotenv').config()

const USING_MOCK = config.keyVault.azureClientSecret === 'useMock'

describe(`BLS service computes salt`, () => {
  beforeEach(() => {
    // Use mock client if env vars not specified
    if (!USING_MOCK) {
      // Ensure all env vars are specified
      expect(config.keyVault.azureClientID).not.toBe('useMock')
      expect(config.keyVault.azureClientSecret).not.toBe('useMock')
      expect(config.keyVault.azureTenant).not.toBe('useMock')
      expect(config.keyVault.azureVaultName).not.toBe('useMock')
      expect(config.keyVault.azureSecretName).not.toBe('useMock')
    }
    if (USING_MOCK) {
      jest.spyOn<any, any>(BLSCryptographyClient, 'getPrivateKey').mockImplementation(() => {
        return 'fakeSecretKey'
      })
    }
  })

  it('provides blinded salt', async () => {
    const queryPhoneNumber = '5555555555'
    // Expected value derived by making request unblinded
    const expected = new Buffer([
      20,
      170,
      113,
      251,
      54,
      95,
      165,
      23,
      231,
      21,
      33,
      0,
      228,
      65,
      208,
      196,
      248,
      162,
      127,
      147,
      232,
      47,
      224,
      247,
      111,
      57,
      199,
      92,
      130,
      152,
      238,
      236,
      114,
      237,
      189,
      96,
      0,
      3,
      97,
      225,
      158,
      38,
      74,
      16,
      97,
      162,
      143,
      0,
    ])
    const blindingFactor = BLINDBLS.generateBlindingFactor()
    const blindedPhoneNumber = BLINDBLS.blindMessage(new Buffer(queryPhoneNumber), blindingFactor)

    expect(
      JSON.stringify(
        BLINDBLS.unblindMessage(
          await BLSCryptographyClient.computeBLSSalt(blindedPhoneNumber as any),
          blindingFactor
        )
      )
    ).toEqual(JSON.stringify(expected))
  })
})
