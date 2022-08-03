import {
  ErrorMessage,
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
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { KeyProvider } from '../../src/common/key-management/key-provider-base'
import { config, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockOdisBalance,
  createMockWeb3,
  getPnpQuotaRequest,
  getPnpQuotaRequestAuthorization,
} = TestUtils.Utils
const { PRIVATE_KEY1, ACCOUNT_ADDRESS1, mockAccount } = TestUtils.Values

const testBlockNumber = 1000000

const mockOdisBalanceTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockContractKit = createMockContractKit(
  {
    [ContractRetrieval.getOdisBalance]: createMockOdisBalance(mockOdisBalanceTotalPaidCUSD),
  },
  createMockWeb3(5, testBlockNumber)
)
jest.mock('../../src/common/web3/contracts', () => ({
  ...jest.requireActual('../../src/common/web3/contracts'),
  getContractKit: jest.fn().mockImplementation(() => mockContractKit),
}))

describe('pnp', () => {
  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  const onChainBalance = new BigNumber(1e18)
  const expectedQuota = 10

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
    app = startSigner(_config, db, keyProvider)
    mockOdisBalanceTotalPaidCUSD.mockReset()
  })

  afterEach(async () => {
    // Close and destroy the in-memory database.
    // Note: If tests start to be too slow, this could be replaced with more complicated logic to
    // reset the database state without destroying and recreting it for each test.

    await db?.destroy()
  })

  describe(`${SignerEndpoint.STATUS}`, () => {
    it('Should provide signature and return 200 on valid request', async () => {
      const res = await request(app).get(SignerEndpoint.STATUS)
      expect(res.status).toBe(200)
    })
  })

  const sendPnpQuotaRequest = async (
    req: PnpQuotaRequest,
    authorization: string,
    signerApp: any = app
  ) => {
    return request(signerApp)
      .get(SignerEndpoint.PNP_QUOTA)
      .set('Authorization', authorization)
      .send(req)
  }

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    describe('quota calculation logic', () => {
      const cusdQuotaParams: [BigNumber, number][] = [
        [new BigNumber(0), 0],
        [new BigNumber(1), 0],
        [new BigNumber(1.56e18), 15],
        // Sanity check for the default values to be used in endpoint setup tests
        [onChainBalance, expectedQuota],
        // Unrealistically large amount paid for ODIS quota
        [new BigNumber(1.23456789e26), 1234567890],
      ]
      cusdQuotaParams.forEach(([cusdWei, expectedTotalQuota]) => {
        it(`Should get totalQuota=${expectedTotalQuota} for ${cusdWei.toString()} cUSD (wei)`, async () => {
          mockOdisBalanceTotalPaidCUSD.mockReturnValue(cusdWei)
          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
          const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
          const res = await sendPnpQuotaRequest(req, authorization)

          expect(res.status).toBe(200)
          expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
            success: true,
            version: res.body.version,
            performedQueryCount: 0,
            totalQuota: expectedTotalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
        })
      })

      it('Should warning if on-chain state cannot be fetched', async () => {
        mockOdisBalanceTotalPaidCUSD.mockImplementation(() => {
          throw new Error('dummy error')
        })
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization)

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: -1,
          blockNumber: testBlockNumber,
          warnings: [ErrorMessage.CONTRACT_GET_FAILURE],
        })
      })
    })

    describe('endpoint functionality', () => {
      // Use values already tested in quota logic tests, [onChainBalance, expectedQuota]
      beforeEach(async () => {
        mockOdisBalanceTotalPaidCUSD.mockReturnValue(onChainBalance)
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

        const res1 = await sendPnpQuotaRequest(req, authorization)
        expect(res1.status).toBe(200)
        expect(res1.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res1.body.version,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendPnpQuotaRequest(req, authorization)
        expect(res2.status).toBe(200)
        expect(res2.body).toMatchObject<PnpQuotaResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization)
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpQuotaRequestAuthorization(
          badRequest,
          ACCOUNT_ADDRESS1,
          PRIVATE_KEY1
        )
        const res = await sendPnpQuotaRequest(badRequest, authorization)

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        // Request from one account, signed by another account
        const badRequest = getPnpQuotaRequest(mockAccount)
        const authorization = getPnpQuotaRequestAuthorization(
          badRequest,
          ACCOUNT_ADDRESS1,
          PRIVATE_KEY1
        )
        const res = await sendPnpQuotaRequest(badRequest, authorization)

        expect(res.status).toBe(401)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        _config.api.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startSigner(_config, db, keyProvider)
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpQuotaRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
        const res = await sendPnpQuotaRequest(req, authorization, appWithApiDisabled)
        expect(res.status).toBe(503)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })
    })
  })
})
