import { AzureKeyProvider } from '../../src/common/key-management/azure-key-provider'
import { DefaultKeyName, Key } from '../../src/common/key-management/key-provider-base'

const mockKey = '030303030303030303030303030303030303030303030303030303030303030303030303'

const key: Key = {
  name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
  version: 1,
}

jest.mock('../../src/config', () => ({
  config: {
    serviceName: 'odis-signer',
    keystore: {
      keys: {
        phoneNumberPrivacy: {
          name: 'phoneNumberPrivacy',
          latest: 1,
        },
        domains: {
          name: 'domains',
          latest: 1,
        },
      },
      azure: {
        clientID: 'mockClientID',
        clientSecret: 'mockClientSecret',
        tenant: 'mockTenant',
        vaultName: 'mockVaultName',
      },
    },
  },
}))

const getSecret = jest.fn()

jest.mock('@celo/wallet-hsm-azure', () => ({
  AzureKeyVaultClient: jest.fn(() => ({ getSecret })),
}))

describe('AzureKeyProvider', () => {
  it('parses keys correctly', async () => {
    getSecret.mockResolvedValue(mockKey)

    const provider = new AzureKeyProvider()
    await provider.fetchPrivateKeyFromStore(key)
    expect(provider.getPrivateKey(key)).toBe(mockKey)
  })

  it('handles exceptions correctly', async () => {
    getSecret.mockRejectedValue(new Error('Secret retrieval exception'))

    const provider = new AzureKeyProvider()
    expect.assertions(1)
    await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
  })
})
