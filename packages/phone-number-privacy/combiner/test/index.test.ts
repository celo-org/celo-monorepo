import { getDataEncryptionKey, isVerified } from '@celo/phone-number-privacy-common'
import { hexToBuffer } from '@celo/utils/lib/address'
import { ec as EC } from 'elliptic'
import { Request, Response } from 'firebase-functions'
import { BLSCryptographyClient } from '../src/bls/bls-cryptography-client'
import { E2E_TEST_ACCOUNTS, E2E_TEST_PHONE_NUMBERS, VERSION } from '../src/config'
import { getTransaction } from '../src/database/database'
import {
  getAccountSignedUserPhoneNumberRecord,
  getDekSignerRecord,
  getDidMatchmaking,
  setDidMatchmaking,
} from '../src/database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../src/database/wrappers/number-pairs'
import { getBlindedMessageSig, getContactMatches } from '../src/index'
import { BLINDED_PHONE_NUMBER, deks } from './end-to-end/resources'

const ec = new EC('secp256k1')

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'
interface DEK {
  privateKey: string
  publicKey: string
  address: string
}

const signWithDEK = (message: string, dek: DEK) => {
  const key = ec.keyFromPrivate(hexToBuffer(dek.privateKey))
  return JSON.stringify(key.sign(message).toDER())
}

jest.mock('@celo/phone-number-privacy-common', () => ({
  ...jest.requireActual('@celo/phone-number-privacy-common'),
  authenticateUser: jest.fn().mockReturnValue(true),
  isVerified: jest.fn(),
  getDataEncryptionKey: jest.fn(),
}))
const mockIsVerified = isVerified as jest.Mock
const mockGetDataEncryptionKey = getDataEncryptionKey as jest.Mock

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = jest.fn()
BLSCryptographyClient.prototype.combinePartialBlindedSignatures = mockComputeBlindedSignature
mockComputeBlindedSignature.mockResolvedValue(BLS_SIGNATURE)
const mockSufficientVerifiedSigs = jest.fn()
BLSCryptographyClient.prototype.hasSufficientSignatures = mockSufficientVerifiedSigs
mockSufficientVerifiedSigs.mockReturnValue(true)

jest.mock('../src/database/wrappers/account')
const mockGetDidMatchmaking = getDidMatchmaking as jest.Mock
const mockSetDidMatchmaking = setDidMatchmaking as jest.Mock
mockSetDidMatchmaking.mockImplementation()
const mockGetAccountSignedUserPhoneNumberRecord = getAccountSignedUserPhoneNumberRecord as jest.Mock
const mockGetDekSignerRecord = getDekSignerRecord as jest.Mock

jest.mock('../src/database/wrappers/number-pairs')
const mockSetNumberPairContacts = setNumberPairContacts as jest.Mock
mockSetNumberPairContacts.mockImplementation()
const mockGetNumberPairContacts = getNumberPairContacts as jest.Mock
mockGetNumberPairContacts.mockResolvedValue([])

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

  const expectFailure = (req: Request, code: number) => {
    it(`Rejects request to matchmake with ${code}`, (done) => {
      getContactMatches(req, invalidResponseExpected(done, code))
    })
  }
  const expectSuccess = (req: Request) => {
    it('provides matches', (done) => expectMatches(req, req.body.contactPhoneNumbers, done))
    it('provides matches empty array', (done) => expectMatches(req, [], done))
  }
  const expectMatches = (req: Request, numbers: string[], done: jest.DoneCallback) => {
    mockGetNumberPairContacts.mockResolvedValue(numbers)
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
  const expectSuccessWithRecord = (req: Request) => {
    expectSuccess(req)
    expectSignatureWasRecorded(req)
  }
  const expectSuccessWithoutRecord = (req: Request) => {
    expectSuccess(req)
    expectSignatureWasNotRecorded()
  }
  const expectFirstMatchmakingToSucceed = (req: Request) => {
    mockGetDidMatchmaking.mockResolvedValue(false)
    expectSuccess(req)
  }
  const expectFirstMatchmakingToSucceedWithoutRecord = (req: Request) => {
    expectFirstMatchmakingToSucceed(req)
    expectSignatureWasNotRecorded()
  }
  const expectFirstMatchmakingToSucceedWithRecord = (req: Request) => {
    expectFirstMatchmakingToSucceed(req)
    expectSignatureWasRecorded(req)
  }
  const expectSignatureWasRecorded = (req: Request) => {
    it('Should have recorded dek phone number signature for the last request', () => {
      expect(mockSetDidMatchmaking).toHaveBeenLastCalledWith(
        req.body.account,
        expect.anything(),
        expect.anything()
      )
    })
  }
  const expectSignatureWasNotRecorded = () => {
    it('Should not have recorded dek phone number signature for the last request', () => {
      expect(mockSetDidMatchmaking).toHaveBeenLastCalledWith(
        validInput.account,
        expect.anything(),
        undefined
      )
    })
  }
  const expectReplaysToFail = (req: Request) => {
    describe('When user has already performed matchmaking', () => {
      beforeAll(() => {
        mockGetDidMatchmaking.mockResolvedValueOnce(true)
      })
      expectFailure(req, 403)
    })
  }
  const expectPotentialReplaysToSucceedWithoutRecord = (req: Request) => {
    it('provides matches on getDidMatchmaking error', (done) => {
      mockGetDidMatchmaking.mockRejectedValueOnce(new Error())
      expectMatches(req, req.body.contactPhoneNumbers, done)
    })
    expectSignatureWasNotRecorded()
  }

  describe('with valid input', () => {
    beforeAll(() => {
      mockIsVerified.mockResolvedValue(true)
    })

    describe('w/o signedUserPhoneNumber', () => {
      const req = {
        body: validInput,
        headers: mockHeaders,
      } as Request
      expectFirstMatchmakingToSucceedWithoutRecord(req)
      expectReplaysToFail(req)
      expectPotentialReplaysToSucceedWithoutRecord(req)
    })

    describe('w/ signedUserPhoneNumber', () => {
      const signedUserPhoneNumber = signWithDEK(validInput.userPhoneNumber, deks[0])
      const req = {
        body: {
          ...validInput,
          signedUserPhoneNumber,
        },
        headers: mockHeaders,
      } as Request

      describe('When DEK is fetched successfully', () => {
        beforeAll(() => {
          mockGetDataEncryptionKey.mockResolvedValue(deks[0].publicKey)
        })

        describe('When DEK signedUserPhoneNumber signature is invalid', () => {
          beforeAll(() => {
            req.body.signedUserPhoneNumber = 'fake'
          })
          afterAll(() => {
            req.body.signedUserPhoneNumber = signedUserPhoneNumber
          })
          expectFailure(req, 403)
        })

        describe('When DEK signedUserPhoneNumber signature is valid', () => {
          expectFirstMatchmakingToSucceedWithRecord(req)
          expectPotentialReplaysToSucceedWithoutRecord(req)

          describe('With replayed requests', () => {
            beforeAll(() => {
              mockGetDidMatchmaking.mockResolvedValue(true)
            })
            describe('When signedUserPhoneNumberRecord matches request', () => {
              beforeAll(() => {
                mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
                  req.body.signedUserPhoneNumber
                )
              })
              expectSuccessWithRecord(req)
              describe('Should bypass verification when e2e test phone number and account are provided', () => {
                beforeAll(() => {
                  mockIsVerified.mockResolvedValue(false)
                  req.body.account = E2E_TEST_ACCOUNTS[0]
                  req.body.userPhoneNumber = E2E_TEST_PHONE_NUMBERS[0]
                  req.body.signedUserPhoneNumber = signWithDEK(req.body.userPhoneNumber, deks[0])
                  mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
                    req.body.signedUserPhoneNumber
                  )
                })
                afterAll(() => {
                  mockIsVerified.mockResolvedValue(true)
                  req.body.account = validInput.account
                  req.body.userPhoneNumber = validInput.userPhoneNumber
                  req.body.signedUserPhoneNumber = signWithDEK(req.body.userPhoneNumber, deks[0])
                  mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
                    req.body.signedUserPhoneNumber
                  )
                })
                expectSuccessWithRecord(req)
              })
            })

            describe('When signedUserPhoneNumberRecord does not match request', () => {
              describe('When user has not rotated their dek', () => {
                beforeAll(() => {
                  mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue('fake')
                })
                expectFailure(req, 403)
              })

              describe('When user has rotated their dek', () => {
                beforeAll(() => {
                  mockGetDataEncryptionKey.mockResolvedValue(deks[1].publicKey)
                  req.body.signedUserPhoneNumber = signWithDEK(validInput.userPhoneNumber, deks[1])
                  mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
                    signWithDEK(validInput.userPhoneNumber, deks[0])
                  )
                  mockGetDekSignerRecord.mockResolvedValue(deks[0].publicKey)
                })
                expectSuccessWithRecord(req)
              })

              describe('When we cannot find a dekSignerRecord for the user', () => {
                beforeAll(() => {
                  mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue('fake')
                  mockGetDekSignerRecord.mockResolvedValue(undefined)
                })
                expectFailure(req, 403)
              })
            })

            describe('When signedUserPhoneNumberRecord does not exist in db', () => {
              beforeAll(() => {
                mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(undefined)
              })
              expectSuccessWithRecord(req)
            })

            describe('When GetAccountSignedUserPhoneNumberRecord throws db error', () => {
              beforeAll(() => {
                mockGetAccountSignedUserPhoneNumberRecord.mockRejectedValue(new Error())
              })
              expectSuccessWithoutRecord(req)
            })
          })
        })
      })

      describe('When DEK is not fetched succesfully', () => {
        beforeAll(() => {
          mockGetDataEncryptionKey.mockRejectedValue(new Error())
        })

        expectFirstMatchmakingToSucceedWithoutRecord(req)
        expectPotentialReplaysToSucceedWithoutRecord(req)

        describe('With replayed requests', () => {
          beforeAll(() => {
            mockGetDidMatchmaking.mockResolvedValue(true)
          })

          describe('When signedUserPhoneNumberRecord matches request', () => {
            beforeAll(() => {
              req.body.signedUserPhoneNumber = signedUserPhoneNumber
              mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(signedUserPhoneNumber)
            })
            expectSuccessWithoutRecord(req)
          })

          describe('When signedUserPhoneNumberRecord does not match request', () => {
            describe('When user has not rotated their dek', () => {
              beforeAll(() => {
                mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue('fake')
              })
              expectFailure(req, 403)
            })

            describe('When user has rotated their dek', () => {
              beforeAll(() => {
                mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(
                  signWithDEK(validInput.userPhoneNumber, deks[1])
                )
                mockGetDekSignerRecord.mockResolvedValue(deks[1].publicKey)
              })
              expectSuccessWithoutRecord(req)
            })

            describe('When we cannot find a dekSignerRecord for the user', () => {
              beforeAll(() => {
                mockGetDekSignerRecord.mockResolvedValue(undefined)
              })
              expectFailure(req, 403)
            })
          })

          describe('When signedUserPhoneNumberRecord does not exist in db', () => {
            beforeAll(() => {
              mockGetAccountSignedUserPhoneNumberRecord.mockResolvedValue(undefined)
            })
            expectSuccessWithoutRecord(req)
          })

          describe('When GetAccountSignedUserPhoneNumberRecord throws db error', () => {
            beforeAll(() => {
              mockGetAccountSignedUserPhoneNumberRecord.mockRejectedValue(new Error())
            })
            expectSuccessWithoutRecord(req)
          })
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
