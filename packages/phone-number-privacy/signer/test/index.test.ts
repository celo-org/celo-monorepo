import request from 'supertest'
import { BLSCryptographyClient } from '../src/bls/bls-cryptography-client'
import { authenticateUser } from '../src/common/identity'
import { getTransaction } from '../src/database/database'
import {
  getDidMatchmaking,
  incrementQueryCount,
  setDidMatchmaking,
} from '../src/database/wrappers/account'
import { getRemainingQueryCount } from '../src/salt-generation/query-quota'
import { app } from '../src/server'

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'

jest.mock('../src/common/identity')
const mockAuthenticateUser = authenticateUser as jest.Mock
mockAuthenticateUser.mockReturnValue(true)

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

jest.mock('../src/database/database')
const mockGetTransaction = getTransaction as jest.Mock
mockGetTransaction.mockReturnValue({ commit: jest.fn(), rollback: jest.fn() })

describe(`POST /getBlindedMessageSignature endpoint`, () => {
  describe('with valid input', () => {
    const blindedQueryPhoneNumber = '+5555555555'
    const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'
    const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

    const mockRequestData = {
      blindedQueryPhoneNumber,
      hashedPhoneNumber,
      account,
    }

    it('provides signature', (done) => {
      mockGetRemainingQueryCount.mockReturnValue(10)
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: true,
            signature: BLS_SIGNATURE,
          },
          done
        )
    })
    it('returns 403 on query count 0', (done) => {
      mockGetRemainingQueryCount.mockReturnValue(0)
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(403, done)
    })
    it('returns 500 on bls error', (done) => {
      mockGetRemainingQueryCount.mockReturnValue(10)
      mockComputeBlindedSignature.mockImplementation(() => {
        throw Error()
      })
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(500, done)
    })
  })
  describe('with invalid input', () => {
    it('invalid address returns 400', (done) => {
      const blindedQueryPhoneNumber = '+5555555555'
      const hashedPhoneNumber = '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96'
      const account = 'd31509C31d654056A45185ECb6'

      const mockRequestData = {
        blindedQueryPhoneNumber,
        hashedPhoneNumber,
        account,
      }

      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect(400, done)
    })

    it('invalid hashedPhoneNumber returns 400', (done) => {
      const blindedQueryPhoneNumber = '+5555555555'
      const hashedPhoneNumber = '+1234567890'
      const account = '0x78dc5D2D739606d31509C31d654056A45185ECb6'

      const mockRequestData = {
        blindedQueryPhoneNumber,
        hashedPhoneNumber,
        account,
      }

      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect(400, done)
    })
  })
})
