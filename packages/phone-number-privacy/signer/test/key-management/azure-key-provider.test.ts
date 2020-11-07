import { AzureKeyProvider } from '../../src/key-management/azure-key-provider'

const mockKey = '030303030303030303030303030303030303030303030303030303030303030303030303'

jest.mock('../../src/config', () => ({
  keystore: {
    azure: {
      clientID: 'mockClientID',
      clientSecret: 'mockClientSecret',
      tenant: 'mockTenant',
      vaultName: 'mockVaultName',
      secretName: 'mockSecretName',
    },
  },
}))

const getSecret = jest.fn()

jest.mock('@celo/contractkit/lib/utils/azure-key-vault-client', () => ({
  AzureKeyVaultClient: jest.fn(() => ({ getSecret })),
}))

describe('AzureKeyProvider', () => {
  it('parses keys correctly', async () => {
    getSecret.mockResolvedValue(mockKey)

    const provider = new AzureKeyProvider()
    await provider.fetchPrivateKeyFromStore()
    expect(provider.getPrivateKey()).toBe(mockKey)
  })

  it('handles exceptions correctly', async () => {
    getSecret.mockRejectedValue(new Error('Secret retrieval exception'))

    const provider = new AzureKeyProvider()
    expect.assertions(1)
    await expect(provider.fetchPrivateKeyFromStore()).rejects.toThrow()
  })
})
