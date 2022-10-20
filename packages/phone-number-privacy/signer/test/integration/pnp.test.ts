import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  ErrorMessage,
  KEY_VERSION_HEADER,
  PhoneNumberPrivacyRequest,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  rootLogger,
  SignerEndpoint,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { BLINDED_PHONE_NUMBER } from '@celo/phone-number-privacy-common/lib/test/values'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import request from 'supertest'
import { initDatabase } from '../../src/common/database/database'
import { ACCOUNTS_TABLE } from '../../src/common/database/models/account'
import { REQUESTS_TABLE } from '../../src/common/database/models/request'
import { countAndThrowDBError } from '../../src/common/database/utils'
import {
  getPerformedQueryCount,
  incrementQueryCount,
} from '../../src/common/database/wrappers/account'
import { getRequestExists } from '../../src/common/database/wrappers/request'
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { KeyProvider } from '../../src/common/key-management/key-provider-base'
import { config, getVersion, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockOdisPayments,
  createMockWeb3,
  getPnpQuotaRequest,
  getPnpRequestAuthorization,
  getPnpSignRequest,
} = TestUtils.Utils
const {
  PRIVATE_KEY1,
  ACCOUNT_ADDRESS1,
  mockAccount,
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
} = TestUtils.Values

jest.setTimeout(20000)

const testBlockNumber = 1000000
const zeroBalance = new BigNumber(0)

const mockOdisPaymentsTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockGetWalletAddress = jest.fn<string, []>()
const mockGetDataEncryptionKey = jest.fn<string, []>()

const mockContractKit = createMockContractKit(
  {
    [ContractRetrieval.getAccounts]: createMockAccounts(
      mockGetWalletAddress,
      mockGetDataEncryptionKey
    ),
    [ContractRetrieval.getOdisPayments]: createMockOdisPayments(mockOdisPaymentsTotalPaidCUSD),
  },
  createMockWeb3(5, testBlockNumber)
)
jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  newKit: jest.fn().mockImplementation(() => mockContractKit),
}))

// Indexes correspond to keyVersion - 1
const expectedSignatures: string[] = [
  'MAAAAAAAAACEVdw1ULDwAiTcZuPnZxHHh38PNa+/g997JgV10QnEq9yeuLxbM9l7vk0EAicV7IAAAAAA',
  'MAAAAAAAAAAmUJY0s9p7fMfs7GIoSiGJoObAN8ZpA7kRqeC9j/Q23TBrG3Jtxc8xWibhNVZhbYEAAAAA',
  'MAAAAAAAAAC4aBbzhHvt6l/b+8F7cILmWxZZ5Q7S6R4RZ/IgZR7Pfb9B1Wg9fsDybgxVTSv5BYEAAAAA',
]

describe('pnp', () => {
  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  const onChainBalance = new BigNumber(1e18)
  const expectedQuota = 10
  const expectedVersion = getVersion()

  // create deep copy
  const _config: typeof config = JSON.parse(JSON.stringify(config))
  _config.db.type = SupportedDatabase.Sqlite
  _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
  _config.api.phoneNumberPrivacy.enabled = true

  const expectedSignature = expectedSignatures[_config.keystore.keys.phoneNumberPrivacy.latest - 1]

  beforeAll(async () => {
    keyProvider = await initKeyProvider(_config)
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    db = await initDatabase(_config)
    app = startSigner(_config, db, keyProvider, newKit('dummyKit'))
    mockOdisPaymentsTotalPaidCUSD.mockReset()
    mockGetDataEncryptionKey.mockReset().mockReturnValue(DEK_PUBLIC_KEY)
    mockGetWalletAddress.mockReset().mockReturnValue(mockAccount)
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

  const sendRequest = async (
    req: PhoneNumberPrivacyRequest,
    authorization: string,
    endpoint: SignerEndpoint,
    keyVersionHeader?: string,
    signerApp: any = app
  ) => {
    const _req = request(signerApp).post(endpoint).set('Authorization', authorization)

    if (keyVersionHeader !== undefined) {
      _req.set(KEY_VERSION_HEADER, keyVersionHeader)
    }

    return _req.send(req)
  }

  type pnpQuotaTestCase = {
    cusdOdisPaymentInWei: BigNumber
    expectedTotalQuota: number
  }
  const quotaCalculationTestCases: pnpQuotaTestCase[] = [
    {
      cusdOdisPaymentInWei: new BigNumber(0),
      expectedTotalQuota: 0,
    },
    {
      cusdOdisPaymentInWei: new BigNumber(1),
      expectedTotalQuota: 0,
    },
    {
      cusdOdisPaymentInWei: new BigNumber(1.56e18),
      expectedTotalQuota: 15,
    },
    {
      // Sanity check for the default values to be used in endpoint setup tests
      cusdOdisPaymentInWei: onChainBalance,
      expectedTotalQuota: expectedQuota,
    },
    {
      // Unrealistically large amount paid for ODIS quota
      cusdOdisPaymentInWei: new BigNumber(1.23456789e26),
      expectedTotalQuota: 1234567890,
    },
  ]

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    describe('quota calculation logic', () => {
      quotaCalculationTestCases.forEach(({ cusdOdisPaymentInWei, expectedTotalQuota }) => {
        it(`Should get totalQuota=${expectedTotalQuota} 
           for cUSD (wei) payment=${cusdOdisPaymentInWei.toString()}`, async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(cusdOdisPaymentInWei)
          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota: expectedTotalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
        })
      })
    })

    describe('endpoint functionality', () => {
      // Use values already tested in quota logic tests, [onChainBalance, expectedQuota]
      beforeEach(async () => {
        mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainBalance)
      })

      it('Should respond with 200 on valid request', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res1 = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res1.body.version,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
        expect(res2.status).toBe(200)
        expect(res2.body).toStrictEqual<PnpQuotaResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on valid request when authenticated with DEK', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, AuthenticationMethod.ENCRYPTION_KEY)
        const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)

        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: 0,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 if performedQueryCount is greater than totalQuota', async () => {
        await db.transaction(async (trx) => {
          for (let i = 0; i <= expectedQuota; i++) {
            await incrementQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(config.serviceName),
              trx
            )
          }
        })
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: expectedQuota + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_QUOTA)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed WALLET_KEY auth', async () => {
        // Request from one account, signed by another account
        const badRequest = getPnpQuotaRequest(mockAccount, AuthenticationMethod.WALLET_KEY)
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_QUOTA)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth', async () => {
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1, AuthenticationMethod.ENCRYPTION_KEY)
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_QUOTA)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
        configWithApiDisabled.api.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(
          req,
          authorization,
          SignerEndpoint.PNP_QUOTA,
          undefined,
          appWithApiDisabled
        )
        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })

      describe('functionality in case of errors', () => {
        it('Should respond with 200 on failure to fetch DEK', async () => {
          mockGetDataEncryptionKey.mockImplementation(() => {
            throw new Error()
          })

          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, AuthenticationMethod.ENCRYPTION_KEY)

          // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: res.body.version,
            performedQueryCount: 0,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [ErrorMessage.FAILURE_TO_GET_DEK, ErrorMessage.FAILING_OPEN],
          })
        })

        it('Should respond with 500 on DB performedQueryCount query failure', async () => {
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'getPerformedQueryCount'
            )
            .mockRejectedValueOnce(new Error())

          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT,
          })

          spy.mockRestore()
        })

        it('Should respond with 500 on blockchain totalQuota query failure', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockImplementation(() => {
            throw new Error('dummy error')
          })
          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_QUOTA)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
          })
        })

        it('Should respond with 500 on signer timeout', async () => {
          const testTimeoutMS = 0
          const delay = 100
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'getPerformedQueryCount'
            )
            .mockImplementation(async () => {
              await new Promise((resolve) => setTimeout(resolve, testTimeoutMS + delay))
              return expectedQuota
            })

          const configWithShortTimeout = JSON.parse(JSON.stringify(_config))
          configWithShortTimeout.timeout = testTimeoutMS
          const appWithShortTimeout = startSigner(
            configWithShortTimeout,
            db,
            keyProvider,
            newKit('dummyKit')
          )
          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(
            req,
            authorization,
            SignerEndpoint.PNP_QUOTA,
            undefined,
            appWithShortTimeout
          )
          // Ensure that this is restored before test can fail on assertions
          // to prevent failures in other tests
          spy.mockRestore()
          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual({
            success: false,
            error: ErrorMessage.TIMEOUT_FROM_SIGNER,
            version: expectedVersion,
          })
          // Allow time for non-killed processes to finish
          await new Promise((resolve) => setTimeout(resolve, delay))
        })
      })
    })
  })

  describe(`${SignerEndpoint.PNP_SIGN}`, () => {
    describe('quota calculation logic', () => {
      quotaCalculationTestCases.forEach(({ expectedTotalQuota, cusdOdisPaymentInWei }) => {
        it(`Should get totalQuota=${expectedTotalQuota} 
           for cUSD (wei) payment=${cusdOdisPaymentInWei.toString()}`, async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(cusdOdisPaymentInWei)

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)

          const shouldSucceed = expectedTotalQuota > 0

          if (shouldSucceed) {
            expect(res.status).toBe(200)
            expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
              success: true,
              version: expectedVersion,
              signature: expectedSignature,
              performedQueryCount: 1, // incremented for signature request
              totalQuota: expectedTotalQuota,
              blockNumber: testBlockNumber,
              warnings: [],
            })
          } else {
            expect(res.status).toBe(403)
            expect(res.body).toStrictEqual<SignMessageResponseFailure>({
              success: false,
              version: expectedVersion,
              performedQueryCount: 0,
              totalQuota: expectedTotalQuota,
              blockNumber: testBlockNumber,
              error: WarningMessage.EXCEEDED_QUOTA,
            })
          }
        })
      })
    })

    describe('endpoint functionality', () => {
      // Use values already tested in quota logic tests, [onChainBalance, expectedQuota]
      const performedQueryCount = 2

      beforeEach(async () => {
        mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainBalance)
        await db.transaction(async (trx) => {
          for (let i = 0; i < performedQueryCount; i++) {
            await incrementQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })
      })

      it('Should respond with 200 on valid request', async () => {
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: res.body.version,
          signature: expectedSignature,
          performedQueryCount: performedQueryCount + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        expect(res.get(KEY_VERSION_HEADER)).toEqual(
          _config.keystore.keys.phoneNumberPrivacy.latest.toString()
        )
      })

      it('Should respond with 200 on valid request when authenticated with DEK', async () => {
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.ENCRYPTION_KEY
        )
        const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: res.body.version,
          signature: expectedSignature,
          performedQueryCount: performedQueryCount + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      for (let i = 1; i <= 3; i++) {
        it(`Should respond with 200 on valid request with key version header ${i}`, async () => {
          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN, i.toString())
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignatures[i - 1],
            performedQueryCount: performedQueryCount + 1,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          expect(res.get(KEY_VERSION_HEADER)).toEqual(i.toString())
        })
      }

      it('Should respond with 200 and warning on repeated valid requests', async () => {
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: res1.body.version,
          signature: expectedSignature,
          performedQueryCount: performedQueryCount + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res2.status).toBe(200)
        res1.body.warnings.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
        expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: res.body.version,
          signature: expectedSignature,
          performedQueryCount: performedQueryCount + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid key version', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN, 'a')
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
      })

      it('Should respond with 400 on invalid blinded message', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          '+1234567890',
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid address', async () => {
        const badRequest = getPnpSignRequest(
          '0xnotanaddress',
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed WALLET_KEY auth', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.ENCRYPTION_KEY
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 403 on out of quota', async () => {
        // deplete user's quota
        const remainingQuota = expectedQuota - performedQueryCount
        await db.transaction(async (trx) => {
          for (let i = 0; i < remainingQuota; i++) {
            await incrementQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })
        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(403)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          performedQueryCount: expectedQuota,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 403 if totalQuota and performedQueryCount are zero', async () => {
        mockOdisPaymentsTotalPaidCUSD.mockReturnValue(zeroBalance)
        const spy = jest // for convenience so we don't have to refactor or reset the db just for this test
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/account'),
            'getPerformedQueryCount'
          )
          .mockResolvedValueOnce(0)

        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(403)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: 0,
          blockNumber: testBlockNumber,
          error: WarningMessage.EXCEEDED_QUOTA,
        })

        spy.mockRestore()
      })

      it('Should respond with 403 if performedQueryCount is greater than totalQuota', async () => {
        const expectedRemainingQuota = expectedQuota - performedQueryCount
        await db.transaction(async (trx) => {
          for (let i = 0; i <= expectedRemainingQuota; i++) {
            await incrementQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })

        // It is possible to reach this state due to our fail-open logic

        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
        expect(res.status).toBe(403)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          performedQueryCount: expectedQuota + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 500 on unsupported key version', async () => {
        const badRequest = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.PNP_SIGN, '4')
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          error: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
        configWithApiDisabled.api.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

        const req = getPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(
          req,
          authorization,
          SignerEndpoint.PNP_SIGN,
          '1',
          appWithApiDisabled
        )
        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })

      describe('functionality in case of errors', () => {
        it('Should return 500 on DB performedQueryCount query failure', async () => {
          // deplete user's quota
          const remainingQuota = expectedQuota - performedQueryCount
          await db.transaction(async (trx) => {
            for (let i = 0; i < remainingQuota; i++) {
              await incrementQueryCount(
                db,
                ACCOUNTS_TABLE.ONCHAIN,
                ACCOUNT_ADDRESS1,
                rootLogger(_config.serviceName),
                trx
              )
            }
          })
          // sanity check
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(expectedQuota)

          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'getPerformedQueryCount'
            )
            .mockRejectedValueOnce(new Error())

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            performedQueryCount: -1,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            error: ErrorMessage.DATABASE_GET_FAILURE,
          })

          spy.mockRestore()
        })

        it('Should respond with 500 on signer timeout', async () => {
          const testTimeoutMS = 0
          const delay = 200
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'getPerformedQueryCount'
            )
            .mockImplementationOnce(async () => {
              await new Promise((resolve) => setTimeout(resolve, testTimeoutMS + delay))
              return performedQueryCount
            })

          const configWithShortTimeout = JSON.parse(JSON.stringify(_config))
          configWithShortTimeout.timeout = testTimeoutMS
          const appWithShortTimeout = startSigner(
            configWithShortTimeout,
            db,
            keyProvider,
            newKit('dummyKit')
          )

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(
            req,
            authorization,
            SignerEndpoint.PNP_SIGN,
            undefined,
            appWithShortTimeout
          )

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual({
            success: false,
            error: ErrorMessage.TIMEOUT_FROM_SIGNER,
            version: expectedVersion,
          })
          spy.mockRestore()
          // Allow time for non-killed processes to finish
          await new Promise((resolve) => setTimeout(resolve, delay))
          // Check that DB was not updated
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(config.serviceName)
            )
          ).toBe(false)
        })

        it('Should return 200 w/ warning on blockchain totalQuota query failure when shouldFailOpen is true', async () => {
          expect(_config.api.phoneNumberPrivacy.shouldFailOpen).toBe(true)
          // deplete user's quota
          const remainingQuota = expectedQuota - performedQueryCount
          await db.transaction(async (trx) => {
            for (let i = 0; i < remainingQuota; i++) {
              await incrementQueryCount(
                db,
                ACCOUNTS_TABLE.ONCHAIN,
                ACCOUNT_ADDRESS1,
                rootLogger(_config.serviceName),
                trx
              )
            }
          })
          // sanity check
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(expectedQuota)

          mockOdisPaymentsTotalPaidCUSD.mockImplementation(() => {
            throw new Error('dummy error')
          })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: expectedQuota + 1, // bc we depleted the user's quota above
            totalQuota: Number.MAX_SAFE_INTEGER,
            blockNumber: testBlockNumber,
            warnings: [ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA, ErrorMessage.FULL_NODE_ERROR],
          })

          // check DB state: performedQueryCount was incremented and request was stored
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(config.serviceName)
            )
          ).toBe(expectedQuota + 1)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(config.serviceName)
            )
          ).toBe(true)
        })

        it('Should return 500 on blockchain totalQuota query failure when shouldFailOpen is false', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockImplementation(() => {
            throw new Error('dummy error')
          })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )

          const configWithFailOpenDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
          configWithFailOpenDisabled.api.phoneNumberPrivacy.shouldFailOpen = false
          const appWithFailOpenDisabled = startSigner(configWithFailOpenDisabled, db, keyProvider)

          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(
            req,
            authorization,
            SignerEndpoint.PNP_SIGN,
            '1',
            appWithFailOpenDisabled
          )

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            performedQueryCount: performedQueryCount,
            totalQuota: -1,
            blockNumber: testBlockNumber,
            error: ErrorMessage.FULL_NODE_ERROR,
          })
        })

        it('Should return 500 on failure to increment query count', async () => {
          const logger = rootLogger(_config.serviceName)
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'incrementQueryCount'
            )
            .mockImplementationOnce(() => {
              countAndThrowDBError(new Error(), logger, ErrorMessage.DATABASE_UPDATE_FAILURE)
            })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
          spy.mockRestore()

          expect.assertions(4)
          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.DATABASE_UPDATE_FAILURE,
          })

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(db, ACCOUNTS_TABLE.ONCHAIN, ACCOUNT_ADDRESS1, logger)
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              logger
            )
          ).toBe(false)
        })

        it('Should return 500 on failure to store request', async () => {
          const logger = rootLogger(_config.serviceName)
          const spy = jest
            .spyOn(jest.requireActual('../../src/common/database/wrappers/request'), 'storeRequest')
            .mockImplementationOnce(() => {
              countAndThrowDBError(new Error(), logger, ErrorMessage.DATABASE_INSERT_FAILURE)
            })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
          spy.mockRestore()

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.DATABASE_INSERT_FAILURE,
          })

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(db, ACCOUNTS_TABLE.ONCHAIN, ACCOUNT_ADDRESS1, logger)
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              logger
            )
          ).toBe(false)
        })

        it('Should return 200 on failure to fetch DEK', async () => {
          mockGetDataEncryptionKey.mockImplementation(() => {
            throw new Error()
          })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.ENCRYPTION_KEY
          )

          // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: performedQueryCount + 1,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [ErrorMessage.FAILURE_TO_GET_DEK, ErrorMessage.FAILING_OPEN],
          })
        })

        it('Should return 500 on bls signing error', async () => {
          const spy = jest
            .spyOn(jest.requireActual('blind-threshold-bls'), 'partialSignBlindedMessage')
            .mockImplementationOnce(() => {
              throw new Error()
            })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            performedQueryCount: performedQueryCount,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            error: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
          })

          spy.mockRestore()

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(_config.serviceName)
            )
          ).toBe(false)
        })

        it('Should return 500 on generic error in sign', async () => {
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/bls/bls-cryptography-client'),
              'computeBlindedSignature'
            )
            .mockImplementationOnce(() => {
              // Trigger a generic error in .sign to trigger the default error returned.
              throw new Error()
            })

          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            performedQueryCount: performedQueryCount,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            error: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
          })

          spy.mockRestore()

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE.ONCHAIN,
              ACCOUNT_ADDRESS1,
              rootLogger(config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE.ONCHAIN,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(config.serviceName)
            )
          ).toBe(false)
        })
      })
    })
  })
})
