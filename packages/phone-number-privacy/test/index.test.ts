import { getNumberPairContacts, setNumberPairContacts } from '../src/database/wrappers/number-pairs'
import { getBlindedMessageSignature, getContactMatches } from '../src/index'
import { computeBLSSalt } from '../src/salt-generation/bls-salt'

const BLS_SALT = '6546544323114343'

jest.mock('../src/common/identity', () => ({
  authenticateUser: jest.fn().mockReturnValue(true),
}))

let mockGetRemainingQueryCount = jest.fn()
jest.mock('../src/salt-generation/query-quota', () => {
  return jest.fn().mockImplementation(() => {
    return { getRemainingQueryCount: mockGetRemainingQueryCount }
  })
})

jest.mock('../src/salt-generation/bls-salt')
const mockBlsSalt = computeBLSSalt as jest.Mock
mockBlsSalt.mockReturnValue(BLS_SALT)

jest.mock('../src/database/wrappers/account', () => ({
  incrementQueryCount: jest.fn().mockReturnValue(new Promise((resolve) => resolve())),
}))

jest.mock('../src/database/wrappers/number-pairs')
const mockSetNumberPairContacts = setNumberPairContacts as jest.Mock
mockSetNumberPairContacts.mockImplementation()
const mockGetNumberPairContacts = getNumberPairContacts as jest.Mock

// TODO the failures are nested in the res structure as a deep equality which does not fail
// the full test
describe(`POST /getBlindedMessageSignature endpoint`, () => {
  describe('with valid input', () => {
    const queryPhoneNumber = '+5555555555'
    const phoneNumber = '+1234567890'
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

    const mockRequestData = {
      queryPhoneNumber,
      phoneNumber,
      account,
    }
    const req = { body: mockRequestData }

    it('provides salt', () => {
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.salt).toEqual(BLS_SALT)
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getBlindedMessageSignature(req, res)
    })
    it('returns 400 on query count 0', () => {
      mockGetRemainingQueryCount = jest.fn(() => 0)
      const res = {
        json() {
          return {}
        },
        status: (status: any) => {
          expect(status).toEqual(400)
          // tslint:disable-next-line: no-empty
          return { json: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getBlindedMessageSignature(req, res)
    })
    it('returns 500 on bls error', () => {
      mockGetRemainingQueryCount = jest.fn()
      mockBlsSalt.mockImplementation(() => {
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
      getBlindedMessageSignature(req, res)
    })
  })
  describe('with invalid input', () => {
    it('invalid phone number returns 400', () => {
      const queryPhoneNumber = '+5555555555'
      const phoneNumber = 'a567890'
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

      const mockRequestData = {
        queryPhoneNumber,
        phoneNumber,
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
      getBlindedMessageSignature(req, res)
    })
    it('invalid address returns 400', () => {
      const queryPhoneNumber = '+5555555555'
      const phoneNumber = '+1234567890'
      const account = 'd31509C31d654056A45185ECb6'

      const mockRequestData = {
        queryPhoneNumber,
        phoneNumber,
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
      getBlindedMessageSignature(req, res)
    })
  })
})

describe(`POST /getContactMatches endpoint`, () => {
  describe('with valid input', () => {
    const userPhoneNumber = '5555555555'
    const contactPhoneNumber1 = '1234567890'
    const contactPhoneNumbers = [contactPhoneNumber1]

    const mockRequestData = {
      userPhoneNumber,
      contactPhoneNumbers,
    }
    const req = { body: mockRequestData }
    it('provides matches', () => {
      mockGetNumberPairContacts.mockReturnValue(contactPhoneNumbers)
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
      const res = {
        json(body: any) {
          expect(body.success).toEqual(true)
          expect(body.matchedContacts).toEqual([])
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getContactMatches(req, res)
    })
  })
  describe('with invalid input', () => {
    it('missing user number returns 400', () => {
      const contactPhoneNumbers = ['1234567890']

      const mockRequestData = {
        contactPhoneNumbers,
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

      const mockRequestData = {
        userPhoneNumber,
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
