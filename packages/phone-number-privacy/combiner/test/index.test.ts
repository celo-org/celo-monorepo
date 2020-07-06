import { Response } from 'node-fetch'
import { BLSCryptographyClient } from '../src/bls/bls-cryptography-client'
import { authenticateUser, isVerified } from '../src/common/identity'
import { VERSION } from '../src/config'
import { getTransaction } from '../src/database/database'
import { getDidMatchmaking, setDidMatchmaking } from '../src/database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../src/database/wrappers/number-pairs'
import { getContactMatches, getDistributedBlindedSalt } from '../src/index'

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'

jest.mock('../src/common/identity')
const mockAuthenticateUser = authenticateUser as jest.Mock
mockAuthenticateUser.mockReturnValue(true)
const mockIsVerified = isVerified as jest.Mock

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = jest.fn()
BLSCryptographyClient.prototype.combinePartialBlindedSignatures = mockComputeBlindedSignature
mockComputeBlindedSignature.mockResolvedValue(BLS_SIGNATURE)
const mockSufficientVerifiedSigs = jest.fn()
BLSCryptographyClient.prototype.sufficientVerifiedSignatures = mockSufficientVerifiedSigs
mockSufficientVerifiedSigs.mockResolvedValue(true)

jest.mock('../src/database/wrappers/account')
const mockGetDidMatchmaking = getDidMatchmaking as jest.Mock
mockGetDidMatchmaking.mockReturnValue(false)
const mockSetDidMatchmaking = setDidMatchmaking as jest.Mock
mockSetDidMatchmaking.mockImplementation()

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

describe(`POST /getDistributedBlindedSalt endpoint`, () => {
  beforeEach(() => {
    fetchMock.mockClear()
    fetchMock.mockImplementation(() => Promise.resolve(new FetchResponse(defaultResponseJson)))
  })

  describe('with valid input', () => {
    const blindedQueryPhoneNumber = '+5555555555'
    const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
    const mockHeader = 'fdsfdsfs'

    const mockRequestData = {
      blindedQueryPhoneNumber,
      hashedPhoneNumber,
      account,
    }
    const req = {
      body: mockRequestData,
      headers: {
        authorization: mockHeader,
      },
    }

    it('provides signature', async () => {
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.combinedSignature).toEqual(BLS_SIGNATURE)
          expect(body.version).toEqual(VERSION)
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getDistributedBlindedSalt(req, res)
    })
    it('returns 500 on bls error', async () => {
      mockComputeBlindedSignature.mockImplementation(() => {
        throw Error()
      })
      const res = {
        status: (status: any) => {
          expect(status).toEqual(500)
          // tslint:disable-next-line: no-empty
          return { json: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getDistributedBlindedSalt(req, res)
    })
  })
  describe('with invalid input', () => {
    it('invalid address returns 400', () => {
      const blindedQueryPhoneNumber = '+5555555555'
      const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'
      const account = 'd31509C31d654056A45185ECb6'

      const mockRequestData = {
        blindedQueryPhoneNumber,
        hashedPhoneNumber,
        account,
      }
      const req = { body: mockRequestData }

      const res = {
        status: (status: any) => {
          expect(status).toEqual(400)
          // tslint:disable-next-line: no-empty
          return { json: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getDistributedBlindedSalt(req, res)
    })
    it('invalid hashedPhoneNumber returns 400', async () => {
      const blindedQueryPhoneNumber = '+5555555555'
      const hashedPhoneNumber = '+1234567890'
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
      const mockHeader = 'fdsfdsfs'

      const mockRequestData = {
        blindedQueryPhoneNumber,
        hashedPhoneNumber,
        account,
      }
      const req = {
        body: mockRequestData,
        headers: {
          authorization: mockHeader,
        },
      }

      const res = {
        status: (status: any) => {
          expect(status).toEqual(400)
          // tslint:disable-next-line: no-empty
          return { json: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getDistributedBlindedSalt(req, res)
    })
  })
})

describe(`POST /getContactMatches endpoint`, () => {
  describe('with valid input', () => {
    const userPhoneNumber = '5555555555'
    const contactPhoneNumber1 = '1234567890'
    const contactPhoneNumbers = [contactPhoneNumber1]
    const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
    const mockHeader = 'fdsfdsfs'

    const mockRequestData = {
      userPhoneNumber,
      contactPhoneNumbers,
      account,
      hashedPhoneNumber,
    }
    const req = {
      body: mockRequestData,
      headers: {
        authorization: mockHeader,
      },
    }
    it('provides matches', async () => {
      mockGetNumberPairContacts.mockReturnValue(contactPhoneNumbers)
      mockIsVerified.mockReturnValue(true)
      const expected = [{ phoneNumber: contactPhoneNumber1 }]
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.matchedContacts).toEqual(expected)
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
    it('provides matches empty array', async () => {
      mockGetNumberPairContacts.mockReturnValue([])
      mockIsVerified.mockReturnValue(true)
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.matchedContacts).toEqual([])
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
    it('rejects more than one attempt to matchmake with 403', async () => {
      mockGetDidMatchmaking.mockReturnValue(true)
      mockIsVerified.mockReturnValue(true)
      const res = {
        status(status: any) {
          expect(status).toEqual(403)
          return {
            json() {
              return {}
            },
          }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
  })
  describe('with invalid input', () => {
    it('missing user number returns 400', async () => {
      const contactPhoneNumbers = ['1234567890']
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
      const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'

      const mockRequestData = {
        contactPhoneNumbers,
        account,
        hashedPhoneNumber,
      }
      const req = { body: mockRequestData }

      const res = {
        status(status: any) {
          expect(status).toEqual(400)
          return {
            json() {
              return {}
            },
          }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
    it('invalid account returns 400', async () => {
      const contactPhoneNumbers = ['1234567890']
      const userPhoneNumber = '5555555555'
      const account = 'garbage'
      const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'

      const mockRequestData = {
        contactPhoneNumbers,
        userPhoneNumber,
        account,
        hashedPhoneNumber,
      }
      const req = { body: mockRequestData }

      const res = {
        status(status: any) {
          expect(status).toEqual(400)
          return {
            json() {
              return {}
            },
          }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
    it('missing contact phone numbers returns 400', async () => {
      const userPhoneNumber = '5555555555'
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
      const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'

      const mockRequestData = {
        userPhoneNumber,
        account,
        hashedPhoneNumber,
      }
      const req = { body: mockRequestData }

      const res = {
        status(status: any) {
          expect(status).toEqual(400)
          return {
            json() {
              return {}
            },
          }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      await getContactMatches(req, res)
    })
  })
})
