import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { AuthenticationMethod, EncryptionKeySigner } from '@celo/identity/lib/odis/query'
import { getDataEncryptionKey, isVerified } from '@celo/phone-number-privacy-common'
import { hexToBuffer } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { ec as EC } from 'elliptic'
import { Request, Response } from 'firebase-functions'
import { BLSCryptographyClient } from '../src/bls/bls-cryptography-client'
import { VERSION } from '../src/config'
import { getTransaction } from '../src/database/database'
import {
  getAccountSignedUserPhoneNumberRecord,
  getDekSignerRecord,
  getDidMatchmaking,
  setDidMatchmaking,
} from '../src/database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../src/database/wrappers/number-pairs'
import { getBlindedMessageSig, getContactMatches } from '../src/index'
import { BLINDED_PHONE_NUMBER } from './end-to-end/resources'

const ec = new EC('secp256k1')

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'

const ENCRYPTION_KEY: EncryptionKeySigner = {
  rawKey: ACCOUNT_PRIVATE_KEYS[0],
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
}

const signWithDEK = (message: string, signer: EncryptionKeySigner) => {
  const key = ec.keyFromPrivate(hexToBuffer(signer.rawKey))
  return JSON.stringify(key.sign(message).toDER())
}

jest.mock('@celo/phone-number-privacy-common', () => ({
  ...jest.requireActual('@celo/phone-number-privacy-common'),
  authenticateUser: jest.fn().mockReturnValue(true),
  isVerified: jest.fn(),
  getDataEncryptionKey: jest.fn(),
  verifySignature: jest.fn(),
}))
const mockIsVerified = isVerified as jest.Mock
const mockGetDataEncryptionKey = getDataEncryptionKey as jest.Mock
mockGetDataEncryptionKey.mockResolvedValue(ACCOUNT_ADDRESSES[0])

jest.mock('@celo/utils/lib/signatureUtils')
const mockVerifySignature = verifySignature as jest.Mock
mockVerifySignature.mockReturnValue(true)

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = jest.fn()
BLSCryptographyClient.prototype.combinePartialBlindedSignatures = mockComputeBlindedSignature
mockComputeBlindedSignature.mockResolvedValue(BLS_SIGNATURE)
const mockSufficientVerifiedSigs = jest.fn()
BLSCryptographyClient.prototype.hasSufficientSignatures = mockSufficientVerifiedSigs
mockSufficientVerifiedSigs.mockReturnValue(true)

jest.mock('../src/database/wrappers/account')
const mockGetDidMatchmaking = getDidMatchmaking as jest.Mock
mockGetDidMatchmaking.mockResolvedValue(false)
const mockSetDidMatchmaking = setDidMatchmaking as jest.Mock
mockSetDidMatchmaking.mockImplementation()
const mockGetAccountSignedUserPhoneNumberRecord = getAccountSignedUserPhoneNumberRecord as jest.Mock
const mockGetDekSignerRecord = getDekSignerRecord as jest.Mock

jest.mock('../src/database/wrappers/number-pairs')
const mockSetNumberPairContacts = setNumberPairContacts as jest.Mock
mockSetNumberPairContacts.mockImplementation()
const mockGetNumberPairContacts = getNumberPairContacts as jest.Mock

jest.mock('../src/database/database')
const mockGetTransaction = getTransaction as jest.Mock
mockGetTransaction.mockReturnValue({})

jest.mock('node-fetch')
const fetchMock: jest.Mock = require('node-fetch')
const FetchResponse: typeof Response = jest.requireActual('node-fetch').Response
const defaultResponseJson = JSON.stringify({
  success: true,
  signature: 'string',
})

const mockHeaders = { authorization: 'fdsfdsfs' }

const invalidResponseExpected = (done: any, code: number) =>
  ({
    status(status: any) {
      try {
        expect(status).toEqual(code)
        done()
      } catch (e) {
        done(e)
      }
      return {
        json() {
          return {}
        },
      }
    },
  } as Response)

describe(`POST /getBlindedMessageSig endpoint`, () => {
  const validRequest = {
    blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
    hashedPhoneNumber: '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96',
    account: '0x78dc5D2D739606d31509C31d654056A45185ECb6',
  }

  beforeEach(() => {
    fetchMock.mockClear()
    fetchMock.mockImplementation(() => Promise.resolve(new FetchResponse(defaultResponseJson)))
  })

  describe('with valid input', () => {
    const req = {
      body: validRequest,
      headers: mockHeaders,
    } as Request

    const validResponseExpected = (done: any, code: number) =>
      ({
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.combinedSignature).toEqual(BLS_SIGNATURE)
          expect(body.version).toEqual(VERSION)
          done()
        },
        status(status: any) {
          try {
            expect(status).toEqual(code)
            done()
          } catch (e) {
            done(e)
          }
          return {
            json() {
              return {}
            },
          }
        },
      } as Response)

    it('provides signature', (done) => {
      getBlindedMessageSig(req, validResponseExpected(done, 200))
    })

    it('returns 500 on bls error', (done) => {
      mockSufficientVerifiedSigs.mockReturnValueOnce(false)
      mockComputeBlindedSignature.mockImplementationOnce(() => {
        throw Error()
      })

      getBlindedMessageSig(req, invalidResponseExpected(done, 500))
    })
  })

  describe('with invalid input', () => {
    it('invalid address returns 400', (done) => {
      const req = {
        body: {
          ...validRequest,
          account: 'd31509C31d654056A45185ECb6',
        },
        headers: mockHeaders,
      } as Request

      getBlindedMessageSig(req, invalidResponseExpected(done, 400))
    })
    it('invalid hashedPhoneNumber returns 400', (done) => {
      const req = {
        body: {
          ...validRequest,
          hashedPhoneNumber: '+1234567890',
        },
        headers: mockHeaders,
      } as Request

      getBlindedMessageSig(req, invalidResponseExpected(done, 400))
    })
    it('invalid blinded phone number returns 400', (done) => {
      const req = {
        body: {
          ...validRequest,
          blindedQueryPhoneNumber: '+1234567890',
        },
        headers: mockHeaders,
      } as Request

      getBlindedMessageSig(req, invalidResponseExpected(done, 400))
    })
  })
})

describe(`POST /getContactMatches endpoint`, () => {
  const validInput = {
    userPhoneNumber: 'o+EZnvfWS3K9X1krfcuH68Ueg1OPzqSnTyFzgtpCGlY=',
    contactPhoneNumbers: ['aXq4I31oe0pSQtl8nq7vTorY9ehCz0z0pN0UMePWK9Y='],
    account: '0x78dc5D2D739606d31509C31d654056A45185ECb6',
    hashedPhoneNumber: '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96',
  }

  beforeAll(() => {
    mockGetDekSignerRecord.mockResolvedValue(ENCRYPTION_KEY.rawKey)
    mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
      signWithDEK(validInput.userPhoneNumber, ENCRYPTION_KEY)
    )
  })

  describe('with valid input', () => {
    beforeAll(() => {
      mockIsVerified.mockResolvedValue(true)
    })

    const expectMatches = (req: Request, numbers: string[], done: jest.DoneCallback) => {
      mockGetNumberPairContacts.mockResolvedValueOnce(numbers)
      const res = {
        json(body: any) {
          try {
            expect(body.success).toEqual(true)
            expect(body.matchedContacts).toEqual(
              numbers.map((number) => ({
                phoneNumber: number,
              }))
            )
            done()
          } catch (e) {
            done(e)
          }
        },
        status(status: any) {
          try {
            expect(status).toEqual(200)
            done()
          } catch (e) {
            done(e)
          }
          return {
            json() {
              return {}
            },
          }
        },
      } as Response

      getContactMatches(req, res)
    }

    const expectSuccessfulMatchmaking = (req: Request) => {
      it('provides matches', (done) => expectMatches(req, req.body.contactPhoneNumbers, done))
      it('provides matches empty array', (done) => expectMatches(req, [], done))
    }

    const expectAllReplaysToFail = (req: Request) => {
      describe('With replayed requests', () => {
        beforeEach(() => {
          mockGetDidMatchmaking.mockResolvedValueOnce(true)
        })
        it('rejects more than one request to matchmake with 403', (done) => {
          getContactMatches(req, invalidResponseExpected(done, 403))
        })
      })
    }

    describe('w/o signedUserPhoneNumber', () => {
      const req = {
        body: validInput,
        headers: mockHeaders,
      } as Request
      expectSuccessfulMatchmaking(req)
      expectAllReplaysToFail(req)
    })

    describe('w/ signedUserPhoneNumber', () => {
      const req = {
        body: {
          ...validInput,
          signedUserPhoneNumber: signWithDEK(validInput.userPhoneNumber, ENCRYPTION_KEY),
        },
        headers: mockHeaders,
      } as Request

      expectSuccessfulMatchmaking(req)

      describe('When DEK cannot be read', () => {
        beforeEach(() => {
          mockGetDataEncryptionKey.mockRejectedValueOnce(new Error())
        })
        expectSuccessfulMatchmaking(req)
        //expectAllReplaysToFail(req) TODO
      })

      describe('When DEK signedUserPhoneNumber signature is invalid', () => {
        beforeEach(() => {
          mockVerifySignature.mockReturnValueOnce(false)
        })

        it('Rejects request to matchmake with 403', (done) => {
          getContactMatches(req, invalidResponseExpected(done, 403))
        })
      })

      describe('With replayed requests', () => {
        beforeEach(() => {
          mockGetDidMatchmaking.mockResolvedValueOnce(true)
        })

        describe('When a signedUserPhoneNumber record exists in the db', () => {
          describe('When the signedUserPhoneNumber record in the db matches the request', () => {
            expectSuccessfulMatchmaking(req)
          })
          describe('When the signedUserPhoneNumber record in the db does not match the request', () => {
            it('Rejects request to matchmake with 403', (done) => {
              getContactMatches(req, invalidResponseExpected(done, 403))
              done()
            })
          })
        })

        describe('When a signedUserPhoneNumber does not exist in the db', () => {
          expectSuccessfulMatchmaking(req)
        })
      })
    })
  })

  describe('with invalid input', () => {
    it('missing user number returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          userPhoneNumber: undefined,
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })

    it('invalid user number returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          userPhoneNumber: '+14155550123',
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })

    it('invalid account returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          account: 'garbage',
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })

    it('missing contact phone numbers returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          contactPhoneNumbers: undefined,
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })

    it('empty contact phone numbers returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          contactPhoneNumbers: [],
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })

    it('invalid contact phone numbers returns 400', (done) => {
      const req = {
        body: {
          ...validInput,
          contactPhoneNumbers: ['+14155550123'],
        },
        headers: mockHeaders,
      } as Request

      getContactMatches(req, invalidResponseExpected(done, 400))
    })
  })
})
