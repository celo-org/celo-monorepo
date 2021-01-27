import { AWSKeyProvider } from '../../src/key-management/aws-key-provider'

const mockKey = '010101010101010101010101010101010101010101010101010101010101010101010101'
const mockResponse = { SecretString: `{"mockSecretKey":"${mockKey}"}` }
const mockEmptyMockSecretKeyResponse = { SecretString: `{"mockSecretKey":""}` }
const mockBinaryResponse = { SecretBinary: Buffer.from(mockKey).toString('base64') }
const mockInvalidResponse1 = { foo: 'bar' }
const mockInvalidResponse2 = { SecretString: 'totally not a json string' }

jest.mock('../../src/config', () => ({
  keystore: {
    aws: {
      region: 'mockRegion',
      secretName: 'mockSecretName',
      secretKey: 'mockSecretKey',
    },
  },
}))

const getSecretValue = jest.fn()

jest.mock('aws-sdk', () => ({
  SecretsManager: jest.fn(() => ({
    config: {
      update: jest.fn(),
    },
    getSecretValue,
  })),
}))

describe('AWSKeyProvider', () => {
  describe('with valid input', () => {
    it('parses string keys correctly', async () => {
      getSecretValue.mockReturnValue({ promise: jest.fn().mockResolvedValue(mockResponse) })

      const provider = new AWSKeyProvider()
      await provider.fetchPrivateKeyFromStore()
      expect(provider.getPrivateKey()).toBe(mockKey)
    })

    it('parses binary keys correctly', async () => {
      getSecretValue.mockReturnValue({ promise: jest.fn().mockResolvedValue(mockBinaryResponse) })

      const provider = new AWSKeyProvider()
      await provider.fetchPrivateKeyFromStore()
      expect(provider.getPrivateKey()).toBe(mockKey)
    })
  })

  describe('with invalid input', () => {
    it('invalid keys are properly handled', async () => {
      getSecretValue.mockReturnValue({
        promise: jest
          .fn()
          .mockResolvedValueOnce(mockInvalidResponse1)
          .mockResolvedValueOnce(mockInvalidResponse2),
      })

      const provider = new AWSKeyProvider()
      expect.assertions(2)
      await expect(provider.fetchPrivateKeyFromStore()).rejects.toThrow()
      await expect(provider.fetchPrivateKeyFromStore()).rejects.toThrow()
    })

    it('empty key is handled correctly', async () => {
      getSecretValue.mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockEmptyMockSecretKeyResponse),
      })

      const provider = new AWSKeyProvider()
      expect.assertions(1)
      await expect(provider.fetchPrivateKeyFromStore()).rejects.toThrow()
    })
  })
})
