import { GoogleKeyProvider } from '../../src/common/key-management/google-key-provider'
import { DefaultKeyName, Key } from '../../src/common/key-management/key-provider-base'

const mockKey = '020202020202020202020202020202020202020202020202020202020202020202020202'
const mockResponse = [{ payload: { data: `${mockKey}` } }]
const emptyMockResponse = [{ payload: {} }]
const invalidMockResponse = [{ payload: { data: '123' } }]
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
      google: {
        projectId: 'mockProject',
      },
    },
  },
}))

const accessSecretVersion = jest.fn()

jest.mock('@google-cloud/secret-manager/build/src/v1', () => ({
  SecretManagerServiceClient: jest.fn(() => ({ accessSecretVersion })),
}))

describe('GoogleKeyProvider', () => {
  it('parses keys correctly', async () => {
    accessSecretVersion.mockResolvedValue(mockResponse)

    const provider = new GoogleKeyProvider()
    await provider.fetchPrivateKeyFromStore(key)
    expect(provider.getPrivateKey(key)).toBe(mockKey)
  })

  it('handles errors correctly', async () => {
    accessSecretVersion.mockResolvedValue(emptyMockResponse)

    const provider = new GoogleKeyProvider()
    expect.assertions(1)
    await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
  })

  it('unitialized provider throws', () => {
    accessSecretVersion.mockResolvedValue(mockResponse)

    const provider = new GoogleKeyProvider()
    expect.assertions(1)
    expect(() => provider.getPrivateKey(key)).toThrow()
  })

  it('set invalid private key throws', async () => {
    accessSecretVersion.mockResolvedValue(invalidMockResponse)

    const provider = new GoogleKeyProvider()
    expect.assertions(1)
    await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
  })
})
