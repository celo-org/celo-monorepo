import { authenticateUser } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import request from 'supertest'
import { ErrorMessage, WarningMessage } from '../../common/src/interfaces/error-utils'
import {
  ContractRetrieval,
  createMockAccounts,
  createMockAttestation,
  createMockContractKit,
  createMockToken,
  createMockWeb3,
} from '../../common/src/test/utils'
import { BLINDED_PHONE_NUMBER } from '../../common/src/test/values'
import { REQUEST_EXPIRY_WINDOW_MS } from '../../common/src/utils/constants'
import { computeBlindedSignature } from '../src/bls/bls-cryptography-client'
import { DEV_PRIVATE_KEY, getVersion } from '../src/config'
import { incrementQueryCount } from '../src/database/wrappers/account'
import { getRequestExists, storeRequest } from '../src/database/wrappers/request'
import { getKeyProvider } from '../src/key-management/key-provider'
import { createServer } from '../src/server'
import { getRemainingQueryCount, getWalletAddress } from '../src/signing/query-quota'
import { getBlockNumber, getContractKit } from '../src/web3/contracts'

const BLS_SIGNATURE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'

jest.setTimeout(10000)

jest.mock('@celo/phone-number-privacy-common', () => ({
  ...jest.requireActual('@celo/phone-number-privacy-common'),
  authenticateUser: jest.fn(),
}))
const mockAuthenticateUser = authenticateUser as jest.Mock

jest.mock('../src/signing/query-quota')
const mockGetRemainingQueryCount = getRemainingQueryCount as jest.Mock
const mockGetWalletAddress = getWalletAddress as jest.Mock

jest.mock('../src/key-management/key-provider')
const mockGetKeyProvider = getKeyProvider as jest.Mock

jest.mock('../src/bls/bls-cryptography-client')
const mockComputeBlindedSignature = computeBlindedSignature as jest.Mock

jest.mock('../src/database/wrappers/account')
const mockIncrementQueryCount = incrementQueryCount as jest.Mock

jest.mock('../src/database/wrappers/request')
const mockStoreRequest = storeRequest as jest.Mock
const mockGetRequestExists = getRequestExists as jest.Mock

jest.mock('../src/web3/contracts')
const mockGetBlockNumber = getBlockNumber as jest.Mock
const mockGetContractKit = getContractKit as jest.Mock

describe(`POST /getBlindedMessageSignature endpoint`, () => {
  const app = createServer()

  beforeEach(() => {
    const mockContractKit = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
        [ContractRetrieval.getStableToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getGoldToken]: createMockToken(new BigNumber(200000000000000000)),
        [ContractRetrieval.getAccounts]: createMockAccounts('0x0'),
      },
      createMockWeb3(0)
    )
    mockGetContractKit.mockImplementation(() => mockContractKit)
    mockAuthenticateUser.mockResolvedValue(true)
    mockGetKeyProvider.mockReturnValue({ getPrivateKey: jest.fn(() => DEV_PRIVATE_KEY) })
    mockComputeBlindedSignature.mockReturnValue(BLS_SIGNATURE)
    mockIncrementQueryCount.mockReturnValue(true)
    mockStoreRequest.mockReturnValue(true)
    mockGetRequestExists.mockReturnValue(false)
    mockGetWalletAddress.mockResolvedValue('0x0')
  })

  const validRequest = {
    blindedQueryPhoneNumber: BLINDED_PHONE_NUMBER,
    hashedPhoneNumber: '0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96',
    account: '0x78dc5D2D739606d31509C31d654056A45185ECb6',
    timestamp: Date.now(),
  }

  describe('with valid input', () => {
    it('provides signature', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
      mockGetBlockNumber.mockResolvedValue(10000)
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: true,
            signature: BLS_SIGNATURE,
            version: getVersion(),
            performedQueryCount: 1,
            totalQuota: 10,
            blockNumber: 10000,
          },
          done
        )
    })
    it('returns 403 on query count 0', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 10, totalQuota: 10 })
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(403, done)
    })
    // We don't want to block the user on DB or blockchain query failure
    it('returns 200 on DB query failure', (done) => {
      mockGetRemainingQueryCount.mockRejectedValue(undefined)
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200, done)
    })
    it('returns 500 on bls error', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
      mockComputeBlindedSignature.mockImplementation(() => {
        throw Error()
      })
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(500, done)
    })
    it('returns 200 with warning on replayed request', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
      mockGetRequestExists.mockReturnValue(true)
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: false,
            signature: BLS_SIGNATURE,
            version: getVersion(),
            performedQueryCount: 0,
            error: WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG,
            totalQuota: 10,
            blockNumber: 10000,
          },
          done
        )
    })
    it('returns 200 with warning on failure to increment query count', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
      mockIncrementQueryCount.mockReturnValue(false)
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: false,
            signature: BLS_SIGNATURE,
            version: getVersion(),
            performedQueryCount: 0,
            error: ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT,
            totalQuota: 10,
            blockNumber: 10000,
          },
          done
        )
    })
    it('returns 200 with warning on failure to store request', (done) => {
      mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
      mockStoreRequest.mockReturnValue(false)
      request(app)
        .post('/getBlindedMessagePartialSig')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(
          200,
          {
            success: false,
            signature: BLS_SIGNATURE,
            version: getVersion(),
            performedQueryCount: 1,
            error: ErrorMessage.FAILURE_TO_STORE_REQUEST,
            totalQuota: 10,
            blockNumber: 10000,
          },
          done
        )
    })
  })
  describe('with invalid input', () => {
    it('invalid address returns 400', (done) => {
      const mockRequestData = {
        ...validRequest,
        account: 'd31509C31d654056A45185ECb6',
      }

      request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
    })

    it('invalid hashedPhoneNumber returns 400', (done) => {
      const mockRequestData = {
        ...validRequest,
        hashedPhoneNumber: '+1234567890',
      }

      request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
    })

    it('expired timestamp returns 400', (done) => {
      const mockRequestData = {
        ...validRequest,
        timestamp: Date.now() - REQUEST_EXPIRY_WINDOW_MS,
      }

      request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
    })

    it('invalid blinded phone number returns 400', (done) => {
      const mockRequestData = {
        ...validRequest,
        blindedQueryPhoneNumber: '1234567890',
      }

      request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
    })
  })
})
