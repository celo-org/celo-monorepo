import { hexToBuffer } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import Logger from 'bunyan'
import { Request } from 'express'
import { AuthenticationMethod } from '../../src/interfaces/requests'
import * as auth from '../../src/utils/authentication'

describe('Authentication test suite', () => {
  const logger = Logger.createLogger({
    name: 'logger',
    level: 'warn',
  })

  describe('authenticateUser utility', () => {
    it("Should fail authentication with missing 'Authorization' header", async () => {
      const sampleRequest: Request = {
        get: (_: string) => '',
        body: {
          account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        },
      } as Request
      const mockContractKit = {} as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    it('Should fail authentication with missing signer', async () => {
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? 'Test' : ''),
        body: {},
      } as Request
      const mockContractKit = {} as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    it('Should succeed authentication with error in getDataEncryptionKey', async () => {
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? 'Test' : ''),
        body: {
          account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
          authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        },
      } as Request
      const mockContractKit = {} as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(true)
    })

    it('Should fail authentication when key is not registered', async () => {
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? 'Test' : ''),
        body: {
          account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
          authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        },
      } as Request
      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                return ''
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    it('Should fail authentication when key is registered but not valid', async () => {
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? 'Test' : ''),
        body: {
          account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
          authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        },
      } as Request
      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                return 'notAValidKeyEncryption'
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    it('Should succeed authentication when key is registered and valid', async () => {
      const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
      const body = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
      }
      const sig = auth.signWithRawKey(JSON.stringify(body), rawKey)
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? sig : ''),
        body,
      } as Request
      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                // NOTE: elliptic is disabled elsewhere in this library to prevent
                // accidental signing of truncated messages.
                // tslint:disable-next-line:import-blacklist
                const EC = require('elliptic').ec
                const ec = new EC('secp256k1')
                const key = ec.keyFromPrivate(hexToBuffer(rawKey))
                return key.getPublic(true, 'hex')
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(true)
    })

    it('Should fail authentication when the message is manipulated', async () => {
      const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
      const body = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
      }
      const message = JSON.stringify(body)

      // Modify every fourth character and check that the signature becomes invalid.
      for (let i = 0; i < message.length; i += 4) {
        const modified =
          message.slice(0, i) +
          String.fromCharCode(message.charCodeAt(i) + 1) +
          message.slice(i + 1)
        const sig = auth.signWithRawKey(modified, rawKey)
        const sampleRequest: Request = {
          get: (name: string) => (name === 'Authorization' ? sig : ''),
          body,
        } as Request
        const mockContractKit = {
          contracts: {
            getAccounts: async () => {
              return Promise.resolve({
                getDataEncryptionKey: async (_: string) => {
                  // NOTE: elliptic is disabled elsewhere in this library to prevent
                  // accidental signing of truncated messages.
                  // tslint:disable-next-line:import-blacklist
                  const EC = require('elliptic').ec
                  const ec = new EC('secp256k1')
                  const key = ec.keyFromPrivate(hexToBuffer(rawKey))
                  return key.getPublic(true, 'hex')
                },
              })
            },
          },
        } as ContractKit

        const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

        expect(result).toBe(false)
      }
    })

    it('Should fail authentication when the key is incorrect', async () => {
      const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
      const body = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
      }
      const sig = auth.signWithRawKey(JSON.stringify(body), rawKey)
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? sig : ''),
        body,
      } as Request

      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                // NOTE: elliptic is disabled elsewhere in this library to prevent
                // accidental signing of truncated messages.
                // tslint:disable-next-line:import-blacklist
                const EC = require('elliptic').ec
                const ec = new EC('secp256k1')
                // Send back a manipulated key.
                const key = ec.keyFromPrivate(hexToBuffer('a' + rawKey.slice(1)))
                return key.getPublic(true, 'hex')
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    it('Should fail authentication when the sigature is modified', async () => {
      const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
      const body = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
      }
      // Manipulate the signature.
      const sig = auth.signWithRawKey(JSON.stringify(body), rawKey)
      const modified = JSON.stringify([0] + JSON.parse(sig))
      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? modified : ''),
        body,
      } as Request

      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                // NOTE: elliptic is disabled elsewhere in this library to prevent
                // accidental signing of truncated messages.
                // tslint:disable-next-line:import-blacklist
                const EC = require('elliptic').ec
                const ec = new EC('secp256k1')
                // Send back a manipulated key.
                const key = ec.keyFromPrivate(hexToBuffer(rawKey))
                return key.getPublic(true, 'hex')
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(false)
    })

    // Backwards compatibility check
    // TODO: Remove this once clients upgrade to @celo/identity v1.5.3
    it('Should succeed authentication when key is registered and valid and signature is incorrectly generated', async () => {
      const rawKey = '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04'
      const body = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
        authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
      }
      // NOTE: elliptic is disabled elsewhere in this library to prevent
      // accidental signing of truncated messages.
      // tslint:disable-next-line:import-blacklist
      const EC = require('elliptic').ec
      const ec = new EC('secp256k1')
      const key = ec.keyFromPrivate(hexToBuffer(rawKey))
      const sig = JSON.stringify(key.sign(JSON.stringify(body)).toDER())

      const sampleRequest: Request = {
        get: (name: string) => (name === 'Authorization' ? sig : ''),
        body,
      } as Request
      const mockContractKit = {
        contracts: {
          getAccounts: async () => {
            return Promise.resolve({
              getDataEncryptionKey: async (_: string) => {
                return key.getPublic(true, 'hex')
              },
            })
          },
        },
      } as ContractKit

      const result = await auth.authenticateUser(sampleRequest, mockContractKit, logger)

      expect(result).toBe(true)
    })
  })

  describe('isVerified utility', () => {
    it('Should succeed when verification is ok', async () => {
      const mockContractKit = {
        contracts: {
          getAttestations: async () => {
            return {
              getVerifiedStatus: async (_: string, __: string) => {
                return {
                  isVerified: true,
                }
              },
            }
          },
        },
      } as ContractKit

      const result = await auth.isVerified('', '', mockContractKit, logger)

      expect(result).toBe(true)
    })

    it('Should fail when verification is not ok', async () => {
      const mockContractKit = {
        contracts: {
          getAttestations: async () => {
            return {
              getVerifiedStatus: async (_: string, __: string) => {
                return {
                  isVerified: false,
                }
              },
            }
          },
        },
      } as ContractKit

      const result = await auth.isVerified('', '', mockContractKit, logger)

      expect(result).toBe(false)
    })
  })
})
