import { AWSKeyProvider } from '../../src/common/key-management/aws-key-provider'
import { DefaultKeyName, Key } from '../../src/common/key-management/key-provider-base'

const mockKey = '010101010101010101010101010101010101010101010101010101010101010101010101'
const mockResponse = { SecretString: `{"mockSecretKey":"${mockKey}"}` }
const mockEmptyMockSecretKeyResponse = { SecretString: `{"mockSecretKey":""}` }
const mockBinaryResponse = { SecretBinary: Buffer.from(mockKey).toString('base64') }
const mockInvalidResponse1 = { foo: 'bar' }
const mockInvalidResponse2 = { SecretString: 'totally not a json string' }

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
      aws: {
        region: 'mockRegion',
        secretKey: 'mockSecretKey',
      },
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
      await provider.fetchPrivateKeyFromStore(key)
      expect(provider.getPrivateKey(key)).toBe(mockKey)
    })

    it('parses binary keys correctly', async () => {
      getSecretValue.mockReturnValue({ promise: jest.fn().mockResolvedValue(mockBinaryResponse) })

      const provider = new AWSKeyProvider()
      await provider.fetchPrivateKeyFromStore(key)
      expect(provider.getPrivateKey(key)).toBe(mockKey)
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
      await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
      await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
    })

    it('empty key is handled correctly', async () => {
      getSecretValue.mockReturnValue({
        promise: jest.fn().mockResolvedValue(mockEmptyMockSecretKeyResponse),
      })

      const provider = new AWSKeyProvider()
      expect.assertions(1)
      await expect(provider.fetchPrivateKeyFromStore(key)).rejects.toThrow()
    })
  })
})
