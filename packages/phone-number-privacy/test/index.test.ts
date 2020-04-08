import { getSalt } from '../src/index'
import { computeBLSSalt } from '../src/salt-generation/bls-salt'
import { getRemainingQueryCount } from '../src/salt-generation/query-quota'

const BLS_SALT = '6546544323114343'

jest.mock('../src/common/identity', () => ({
  authenticateUser: jest.fn().mockReturnValue(true),
}))

jest.mock('../src/salt-generation/query-quota')
const mockReaminingQueryCount = getRemainingQueryCount as jest.Mock
mockReaminingQueryCount.mockResolvedValue(2)

jest.mock('../src/salt-generation/bls-salt')
const mockBlsSalt = computeBLSSalt as jest.Mock
mockBlsSalt.mockReturnValue(BLS_SALT)

jest.mock('../src/database/wrappers/account', () => ({
  incrementQueryCount: jest.fn().mockReturnValue(new Promise((resolve) => resolve())),
}))

// TODO the failures are nested in the res structure as a deep equality which does not fail
// the full test
describe(`POST /getSalt endpoint`, () => {
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
        json: (body: any) => {
          expect(body.success).toEqual(true)
          expect(body.salt).toEqual(BLS_SALT)
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getSalt(req, res)
    })
    it('returns 400 on query count 0', () => {
      mockReaminingQueryCount.mockResolvedValue(0)
      const res = {
        status: (status: any) => {
          expect(status).toEqual(400)
          // tslint:disable-next-line: no-empty
          return { send: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getSalt(req, res)
    })
    it('returns 500 on bls error', () => {
      mockReaminingQueryCount.mockResolvedValue(2)
      mockBlsSalt.mockImplementation(() => {
        throw Error()
      })
      const res = {
        status: (status: any) => {
          expect(status).toEqual(500)
          // tslint:disable-next-line: no-empty
          return { send: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getSalt(req, res)
    })
  })
  mockBlsSalt.mockReturnValue(BLS_SALT)
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
          return { send: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getSalt(req, res)
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
          return { send: () => {} }
        },
      }
      // @ts-ignore TODO fix req type to make it a mock express req
      getSalt(req, res)
    })
  })
})
