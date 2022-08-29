import { newKit, StableToken } from '@celo/contractkit'
import {
  isVerified,
  PnpQuotaRequest,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  SignerEndpoint,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import request from 'supertest'
import { initDatabase } from '../../src/common/database/database'
import { getPerformedQueryCount } from '../../src/common/database/wrappers/account'
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { KeyProvider } from '../../src/common/key-management/key-provider-base'
import { config, getVersion, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockToken,
  createMockWeb3,
  getPnpQuotaRequest,
  getPnpRequestAuthorization,
} = TestUtils.Utils
const { IDENTIFIER, PRIVATE_KEY1, ACCOUNT_ADDRESS1, mockAccount } = TestUtils.Values

const testBlockNumber = 1000000

const mockBalanceOfCUSD = jest.fn<BigNumber, []>()
const mockBalanceOfCEUR = jest.fn<BigNumber, []>()
const mockBalanceOfCELO = jest.fn<BigNumber, []>()

const mockContractKit = createMockContractKit(
  {
    // getWalletAddress stays constant across all old query-quota.test.ts unit tests
    [ContractRetrieval.getAccounts]: createMockAccounts(mockAccount),
    [ContractRetrieval.getStableToken]: jest.fn(),
    [ContractRetrieval.getGoldToken]: createMockToken(mockBalanceOfCELO),
  },
  createMockWeb3(5, testBlockNumber)
)

// Necessary for distinguishing between mocked stable tokens
mockContractKit.contracts[ContractRetrieval.getStableToken] = jest.fn(
  (stableToken: StableToken) => {
    switch (stableToken) {
      case StableToken.cUSD:
        return createMockToken(mockBalanceOfCUSD)
      case StableToken.cEUR:
        return createMockToken(mockBalanceOfCEUR)
      default:
        return createMockToken(jest.fn().mockReturnValue(new BigNumber(0)))
    }
  }
)

jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  newKit: jest.fn().mockImplementation(() => mockContractKit),
}))

jest.mock('../../src/common/database/wrappers/account')
const mockPerformedQueryCount = getPerformedQueryCount as jest.Mock

jest.mock('@celo/phone-number-privacy-common', () => ({
  ...jest.requireActual('@celo/phone-number-privacy-common'),
  isVerified: jest.fn(),
}))
const mockIsVerified = isVerified as jest.Mock

describe('legacyPNP', () => {
  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  const expectedVersion = getVersion()
  const _config = config

  beforeAll(async () => {
    _config.db.type = SupportedDatabase.Sqlite
    _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
    keyProvider = await initKeyProvider(_config)
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    _config.api.phoneNumberPrivacy.enabled = true
    db = await initDatabase(_config)
    app = startSigner(_config, db, keyProvider, newKit('dummyKit'))
  })

  afterEach(async () => {
    // Close and destroy the in-memory database.
    // Note: If tests start to be too slow, this could be replaced with more complicated logic to
    // reset the database state without destroying and recreting it for each test.

    await db?.destroy()
  })

  describe(`${SignerEndpoint.STATUS}`, () => {
    it('Should return 200 and correct version', async () => {
      const res = await request(app).get(SignerEndpoint.STATUS)
      expect(res.status).toBe(200)
      expect(res.body.version).toBe(expectedVersion)
    })
  })

  const sendPnpQuotaRequest = async (
    req: PnpQuotaRequest,
    authorization: string,
    signerApp: any = app
  ) => {
    return request(signerApp)
      .post(SignerEndpoint.LEGACY_PNP_QUOTA)
      .set('Authorization', authorization)
      .send(req)
  }

  describe(`${SignerEndpoint.LEGACY_PNP_QUOTA}`, () => {
    const zeroBalance = new BigNumber(0)
    const twentyCents = new BigNumber(200000000000000000)

    const prepMocks = (
      performedQueryCount: number,
      transactionCount: number,
      _isVerified: boolean,
      balanceCUSD: BigNumber,
      balanceCEUR: BigNumber,
      balanceCELO: BigNumber
    ) => {
      ;[
        mockPerformedQueryCount,
        mockContractKit.connection.getTransactionCount,
        mockIsVerified,
        mockBalanceOfCUSD,
        mockBalanceOfCEUR,
        mockBalanceOfCELO,
      ].forEach((mockFn) => mockFn.mockReset())

      mockPerformedQueryCount.mockImplementation(
        () => new Promise((resolve) => resolve(performedQueryCount))
      )
      mockContractKit.connection.getTransactionCount.mockReturnValue(transactionCount)
      mockIsVerified.mockReturnValue(_isVerified)
      mockBalanceOfCUSD.mockReturnValue(balanceCUSD)
      mockBalanceOfCEUR.mockReturnValue(balanceCEUR)
      mockBalanceOfCELO.mockReturnValue(balanceCELO)
    }

    describe('quota calculation logic: calculates remaining query count', () => {
      const runLegacyQuotaTestCase = async (
        performedQueryCount: number,
        transactionCount: number,
        _isVerified: boolean,
        balanceCUSD: BigNumber,
        balanceCEUR: BigNumber,
        balanceCELO: BigNumber,
        identifier: string | undefined,
        expectedPerformedQueryCount: number,
        expectedTotalQuota: number
      ) => {
        prepMocks(
          performedQueryCount,
          transactionCount,
          _isVerified,
          balanceCUSD,
          balanceCEUR,
          balanceCELO
        )

        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, identifier)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization)

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: expectedPerformedQueryCount,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      }

      it('for verified account', async () => {
        await runLegacyQuotaTestCase(
          2,
          5,
          true,
          zeroBalance,
          zeroBalance,
          zeroBalance,
          IDENTIFIER,
          2,
          60
        )
      })

      it('for unverified account with no transactions', async () => {
        await runLegacyQuotaTestCase(
          1,
          0,
          false,
          twentyCents,
          twentyCents,
          twentyCents,
          IDENTIFIER,
          1,
          10
        )
      })

      it('for verified account with many txs and balance', async () => {
        await runLegacyQuotaTestCase(
          10,
          100,
          true,
          twentyCents,
          twentyCents,
          twentyCents,
          IDENTIFIER,
          10,
          440
        )
      })

      it('for unverified account with many txs and balance', async () => {
        await runLegacyQuotaTestCase(
          0,
          100,
          false,
          twentyCents,
          twentyCents,
          twentyCents,
          IDENTIFIER,
          0,
          410
        )
      })

      it('for unverified account without any balance (with txs)', async () => {
        await runLegacyQuotaTestCase(
          0,
          100,
          false,
          zeroBalance,
          zeroBalance,
          zeroBalance,
          IDENTIFIER,
          0,
          0
        )
      })

      it('for unverified account with only cUSD balance (no txs)', async () => {
        await runLegacyQuotaTestCase(
          1,
          0,
          false,
          twentyCents,
          zeroBalance,
          zeroBalance,
          IDENTIFIER,
          1,
          10
        )
      })

      it('for unverified account with only cEUR balance (no txs)', async () => {
        await runLegacyQuotaTestCase(
          1,
          0,
          false,
          zeroBalance,
          twentyCents,
          zeroBalance,
          IDENTIFIER,
          1,
          10
        )
      })

      it('for unverified account with only CELO balance (no txs)', async () => {
        await runLegacyQuotaTestCase(
          1,
          0,
          false,
          zeroBalance,
          zeroBalance,
          twentyCents,
          IDENTIFIER,
          1,
          10
        )
      })

      it('when no phone number hash is provided', async () => {
        await runLegacyQuotaTestCase(
          1,
          0,
          false,
          twentyCents,
          twentyCents,
          twentyCents,
          undefined,
          1,
          10
        )
      })
    })

    describe('endpoint functionality', () => {
      // Use values from 'unverified account with no transactions' logic test case
      const performedQueryCount = 1
      const expectedQuota = 10

      beforeEach(async () => {
        prepMocks(performedQueryCount, 0, false, twentyCents, twentyCents, twentyCents)
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res1 = await sendPnpQuotaRequest(req, authorization)
        expect(res1.status).toBe(200)
        expect(res1.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res1.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendPnpQuotaRequest(req, authorization)
        expect(res2.status).toBe(200)
        expect(res2.body).toMatchObject<PnpQuotaResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization)
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(badRequest, authorization)

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        // Request from one account, signed by another account
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendPnpQuotaRequest(badRequest, authorization)

        expect(res.status).toBe(401)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        _config.api.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startSigner(_config, db, keyProvider, newKit('dummyKit'))
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization, appWithApiDisabled)
        expect.assertions(2)
        expect(res.status).toBe(503)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })
    })
  })

  // const sendLegacyPnpSignatureRequest = async (
  //   req: SignMessageRequest,
  //   authorization: string,
  //   signerApp: any = app
  // ) => {
  //   return request(signerApp)
  //     .get(SignerEndpoint.LEGACY_PNP_SIGN)
  //     .set('Authorization', authorization)
  //     .send(req)
  // }

  // // TODO: add signature tests
  // describe(`${SignerEndpoint.LEGACY_PNP_SIGN}`, () => {
  //   // it('Should return 200 and correct version', async () => {
  //   //   const res = await request(app).get(SignerEndpoint.STATUS)
  //   //   expect(res.status).toBe(200)
  //   //   expect(res.body.version).toBe(expectedVersion)
  //   // })

  //   // TODO: delete this test if duplicated in integration tests
  //   it('provides signature', async () => {
  //     // mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     // mockGetBlockNumber.mockResolvedValue(10000)

  //     await sendLegacyPnpSignatureRequest(

  //     )

  //     const res = await request(app).get(SignerEndpoint.STATUS)
  //     expect(res.status).toBe(200)
  //     expect(res.body.version).toBe(expectedVersion)

  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(
  //         200,
  //         {
  //           success: true,
  //           signature: BLS_SIGNATURE,
  //           version: getVersion(),
  //           performedQueryCount: 1,
  //           totalQuota: 10,
  //           blockNumber: 10000,
  //         },
  //         done
  //       )
  //   })
  //   // TODO: delete this test if duplicated in integration tests
  //   // Backwards compatibility check
  //   it('provides signature w/ expired timestamp', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     mockGetBlockNumber.mockResolvedValue(10000)
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send({ ...validRequest, timestamp: Date.now() - 10 * 60 * 1000 }) // 10 minutes ago
  //       .expect('Content-Type', /json/)
  //       .expect(
  //         200,
  //         {
  //           success: true,
  //           signature: BLS_SIGNATURE,
  //           version: getVersion(),
  //           performedQueryCount: 1,
  //           totalQuota: 10,
  //           blockNumber: 10000,
  //         },
  //         done
  //       )
  //   })

  //   // TODO: delete this test if duplicated in integration tests
  //   it('returns 403 on query count 0', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 10, totalQuota: 10 })
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(403, done)
  //   })

  //   // TODO: preserve this test
  //   // We don't want to block the user on DB or blockchain query failure
  //   it('returns 200 on DB query failure', (done) => {
  //     mockGetRemainingQueryCount.mockRejectedValue(undefined)
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(200, done)
  //   })

  //   // TODO: preserve this test
  //   it('returns 500 on bls error', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     mockComputeBlindedSignature.mockImplementation(() => {
  //       throw Error()
  //     })
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(500, done)
  //   })

  //   // TODO: preserve this test
  //   it('returns 200 with warning on replayed request', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     mockGetRequestExists.mockReturnValue(true)
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(
  //         200,
  //         {
  //           success: false,
  //           signature: BLS_SIGNATURE,
  //           version: getVersion(),
  //           performedQueryCount: 0,
  //           error: WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG,
  //           totalQuota: 10,
  //           blockNumber: 10000,
  //         },
  //         done
  //       )
  //   })

  //   // TODO: preserve this test
  //   it('returns 200 with warning on failure to increment query count', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     mockIncrementQueryCount.mockReturnValue(false)
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(
  //         200,
  //         {
  //           success: false,
  //           signature: BLS_SIGNATURE,
  //           version: getVersion(),
  //           performedQueryCount: 0,
  //           error: ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT,
  //           totalQuota: 10,
  //           blockNumber: 10000,
  //         },
  //         done
  //       )
  //   })

  //   // TODO: preserve this test
  //   it('returns 200 with warning on failure to store request', (done) => {
  //     mockGetRemainingQueryCount.mockResolvedValue({ performedQueryCount: 0, totalQuota: 10 })
  //     mockStoreRequest.mockReturnValue(false)
  //     request(app)
  //       .post('/getBlindedMessagePartialSig')
  //       .send(validRequest)
  //       .expect('Content-Type', /json/)
  //       .expect(
  //         200,
  //         {
  //           success: false,
  //           signature: BLS_SIGNATURE,
  //           version: getVersion(),
  //           performedQueryCount: 1,
  //           error: ErrorMessage.FAILURE_TO_STORE_REQUEST,
  //           totalQuota: 10,
  //           blockNumber: 10000,
  //         },
  //         done
  //       )
  //   })
  // })

  // describe('with invalid input', () => {
  //   // TODO: preserve this test
  //   it('invalid address returns 400', (done) => {
  //     const mockRequestData = {
  //       ...validRequest,
  //       account: 'd31509C31d654056A45185ECb6',
  //     }

  //     request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
  //   })

  //   // TODO: preserve this test
  //   it('invalid hashedPhoneNumber returns 400', (done) => {
  //     const mockRequestData = {
  //       ...validRequest,
  //       hashedPhoneNumber: '+1234567890',
  //     }

  //     request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
  //   })

  //   // TODO: preserve this test
  //   it('invalid blinded phone number returns 400', (done) => {
  //     const mockRequestData = {
  //       ...validRequest,
  //       blindedQueryPhoneNumber: '1234567890',
  //     }

  //     request(app).post('/getBlindedMessagePartialSig').send(mockRequestData).expect(400, done)
  //   })
  // })
})
