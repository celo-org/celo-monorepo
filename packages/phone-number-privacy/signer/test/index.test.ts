import request from 'supertest'
import { computeBlindedSignature } from '../src/bls/bls-cryptography-client'
import { authenticateUser } from '../src/common/identity'
import { DEV_PRIVATE_KEY, getVersion } from '../src/config'
import {
  getDidMatchmaking,
  incrementQueryCount,
  setDidMatchmaking,
} from '../src/database/wrappers/account'
import { getKeyProvider } from '../src/key-management/key-provider'
import { getRemainingQueryCount } from '../src/salt-generation/query-quota'
import { createServer } from '../src/server'
import { getBlockNumber } from '../src/web3/contracts'

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'

jest.mock('../src/common/identity')
const mockAuthenticateUser = authenticateUser as jest.Mock
mockAuthenticateUser.mockReturnValue(true)

jest.mock('../src/salt-generation/query-quota')
const mockGetRemainingQueryCount = getRemainingQueryCount as jest.Mock

jest.mock('../src/key-management/key-provider')
const mockGetKeyProvider = getKeyProvider as jest.Mock
mockGetKeyProvider.mockReturnValue({ getPrivateKey: jest.fn(() => DEV_PRIVATE_KEY) })

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = computeBlindedSignature as jest.Mock
mockComputeBlindedSignature.mockReturnValue(BLS_SIGNATURE)

jest.mock('../src/database/wrappers/account')
const mockIncrementQueryCount = incrementQueryCount as jest.Mock
mockIncrementQueryCount.mockImplementation()
const mockGetDidMatchmaking = getDidMatchmaking as jest.Mock
mockGetDidMatchmaking.mockReturnValue(false)
const mockSetDidMatchmaking = setDidMatchmaking as jest.Mock
mockSetDidMatchmaking.mockImplementation()

jest.mock('../src/web3/contracts')
const mockGetBlockNumber = getBlockNumber as jest.Mock

describe(`POST /getBlindedMessageSignature endpoint`, () => {
  const app = createServer()

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
      mockGetRemainingQueryCount.mockReturnValue({ performedQueryCount: 0, totalQuota: 10 })
      mockGetBlockNumber.mockReturnValue(10000)
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: true,
            signature: BLS_SIGNATURE,
            version: getVersion(),
            performedQueryCount: 0,
            totalQuota: 10,
            blockNumber: 10000,
          },
          done
        )
    })
    it('returns 403 on query count 0', (done) => {
      mockGetRemainingQueryCount.mockReturnValue({ performedQueryCount: 10, totalQuota: 10 })
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(403, done)
    })
    // We don't want to block the user on DB or blockchain query failure
    it('returns 200 on DB query failure', (done) => {
      mockGetRemainingQueryCount.mockRejectedValue(undefined)
      request(app)
        .post('/getBlindedSalt')
        .send(mockRequestData)
        .expect('Content-Type', /json/)
        .expect(200, done)
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
