import { AWSKeyProvider } from '../../src/key-management/aws-key-provider'

const mockKey = '010101010101010101010101010101010101010101010101010101010101010101010101'
const mockResponse = { SecretString: `{"mockSecretKey":"${mockKey}"}` }

jest.mock('../../src/config', () => ({
  keystore: {
    aws: {
      region: 'mockRegion',
      secretName: 'mockSecretName',
      secretKey: 'mockSecretKey',
    },
  },
}))

jest.mock('aws-sdk', () => ({
  SecretsManager: jest.fn(() => ({
    config: {
      update: jest.fn(),
    },
    getSecretValue: jest.fn(() => ({ promise: jest.fn().mockResolvedValue(mockResponse) })),
  })),
}))

describe('AWSKeyProvider', () => {
  it('parses keys correctly', async () => {
    const provider = new AWSKeyProvider()
    await provider.fetchPrivateKeyFromStore()
    expect(provider.getPrivateKey()).toBe(mockKey)
  })
})
