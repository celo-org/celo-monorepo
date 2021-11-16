import { GoogleKeyProvider } from '../../src/key-management/google-key-provider'
import { Key } from '../../src/key-management/key-provider-base'
import { KeyName } from '@celo/phone-number-privacy-common'

const mockKey = '020202020202020202020202020202020202020202020202020202020202020202020202'
const mockResponse = [{ payload: { data: `${mockKey}` } }]
const emptyMockResponse = [{ payload: {} }]
const invalidMockResponse = [{ payload: { data: '123' } }]
const key: Key = {
  name: KeyName.phoneNumberPrivacy,
  version: 1,
}

jest.mock('../../src/config', () => ({
  keystore: {
    google: {
      projectId: 'mockProject',
      secretName: 'mockSecretName',
      secretVersion: 'mockSecretVersion',
    },
  },
}))

const accessSecretVersion = jest.fn()

jest.mock('@google-cloud/secret-manager', () => ({
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
