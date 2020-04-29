import { authenticateUser, isVerified } from '../src/common/identity'
import { BLSCryptographyClient } from '../src/bls/bls-cryptography-client'
import {
  getDidMatchmaking,
  incrementQueryCount,
  setDidMatchmaking,
} from '../src/database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../src/database/wrappers/number-pairs'
import { getBlindedSalt, getContactMatches } from '../src/index'
import { getRemainingQueryCount } from '../src/salt-generation/query-quota'

const BLS_SIGNATURE = '6546544323114343'

jest.mock('../src/common/identity')
const mockAuthenticateUser = authenticateUser as jest.Mock
mockAuthenticateUser.mockReturnValue(true)
const mockIsVerified = isVerified as jest.Mock

jest.mock('../src/salt-generation/query-quota')
const mockGetRemainingQueryCount = getRemainingQueryCount as jest.Mock

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = BLSCryptographyClient.computeBlindedSignature as jest.Mock
mockComputeBlindedSignature.mockResolvedValue(BLS_SIGNATURE)

jest.mock('../src/database/wrappers/account')
const mockIncrementQueryCount = incrementQueryCount as jest.Mock
mockIncrementQueryCount.mockImplementation()
const mockGetDidMatchmaking = getDidMatchmaking as jest.Mock
mockGetDidMatchmaking.mockReturnValue(false)
const mockSetDidMatchmaking = setDidMatchmaking as jest.Mock
mockSetDidMatchmaking.mockImplementation()

jest.mock('../src/database/wrappers/number-pairs')
const mockSetNumberPairContacts = setNumberPairContacts as jest.Mock
mockSetNumberPairContacts.mockImplementation()
const mockGetNumberPairContacts = getNumberPairContacts as jest.Mock

// TODO the failures are nested in the res structure as a deep equality which does not fail
// the full test
describe(`POST /getBlindedMessageSignature endpoint`, () => {
  describe('with valid input', () => {
    const blindedQueryPhoneNumber = '+5555555555'
    const hashedPhoneNumber = '+1234567890'
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

    const mockRequestData = {
      blindedQueryPhoneNumber,
      hashedPhoneNumber,
      account,
    }
    const req = { body: mockRequestData }

    it('provides signature', () => {
      mockGetRemainingQueryCount.mockReturnValue(10)
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.signature).toEqual(BLS_SIGNATURE)
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getBlindedSalt(req, res)
    })
    it('returns 403 on query count 0', () => {
      mockGetRemainingQueryCount.mockReturnValue(0)
      const res = {
        json() {
          return {}
        },
        status: (status: any) => {
          expect(status).toEqual(403)
          // tslint:disable-next-line: no-empty
          return { json: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getBlindedSalt(req, res)
    })
    it('returns 500 on bls error', () => {
      mockGetRemainingQueryCount.mockReturnValue(10)
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
      getBlindedSalt(req, res)
    })
  })
  describe('with invalid input', () => {
    it('invalid address returns 400', () => {
      const blindedQueryPhoneNumber = '+5555555555'
      const hashedPhoneNumber = '+1234567890'
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
      getBlindedSalt(req, res)
    })
  })
})

describe(`POST /getContactMatches endpoint`, () => {
  describe('with valid input', () => {
    const userPhoneNumber = '5555555555'
    const contactPhoneNumber1 = '1234567890'
    const contactPhoneNumbers = [contactPhoneNumber1]
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

    const mockRequestData = {
      userPhoneNumber,
      contactPhoneNumbers,
      account,
    }
    const req = { body: mockRequestData }
    it('provides matches', () => {
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
      getContactMatches(req, res)
    })
    it('provides matches empty array', () => {
      mockGetNumberPairContacts.mockReturnValue([])
      mockIsVerified.mockReturnValue(true)
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.matchedContacts).toEqual([])
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getContactMatches(req, res)
    })
    it('rejects more than one attempt to matchmake with 403', () => {
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
      getContactMatches(req, res)
    })
  })
  describe('with invalid input', () => {
    it('missing user number returns 400', () => {
      const contactPhoneNumbers = ['1234567890']
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

      const mockRequestData = {
        contactPhoneNumbers,
        account,
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
      getContactMatches(req, res)
    })
    it('invalid account returns 400', () => {
      const contactPhoneNumbers = ['1234567890']
      const userPhoneNumber = '5555555555'
      const account = 'garbage'

      const mockRequestData = {
        contactPhoneNumbers,
        userPhoneNumber,
        account,
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
      getContactMatches(req, res)
    })
    it('missing contact phone numbers returns 400', () => {
      const userPhoneNumber = '5555555555'
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

      const mockRequestData = {
        userPhoneNumber,
        account,
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
      getContactMatches(req, res)
    })
  })
})
