import { AttestationsStatus } from '@celo/base'
import { newKit, StableToken } from '@celo/contractkit'
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
import {
  createMockOdisPayments,
  getPnpSignRequest,
} from '@celo/phone-number-privacy-common/lib/test/utils'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import request from 'supertest'
import { initDatabase } from '../../src/common/database/database'
import { ACCOUNTS_TABLE_LEGACY } from '../../src/common/database/models/account'
import { REQUESTS_TABLE_LEGACY } from '../../src/common/database/models/request'
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
  createMockToken,
  createMockWeb3,
  getPnpQuotaRequest,
  getPnpRequestAuthorization,
  createMockAttestation,
  getLegacyPnpSignRequest,
} = TestUtils.Utils
const {
  IDENTIFIER,
  PRIVATE_KEY1,
  ACCOUNT_ADDRESS1,
  mockAccount,
  BLINDED_PHONE_NUMBER,
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
} = TestUtils.Values

// TODO(2.0.0, timeout) revisit flake tracker timeouts under the umbrella of
// https://github.com/celo-org/celo-monorepo/issues/9845
jest.setTimeout(20000)

const expectedSignature =
  'MAAAAAAAAAAEFHu3gWowoNJvvWkINGZR/1no37LPBFYRIHu3h5xYowXo1tlIlrL9CbN0cNqcKIAAAAAA'

const testBlockNumber = 1000000

const mockBalanceOfCUSD = jest.fn<BigNumber, []>()
const mockBalanceOfCEUR = jest.fn<BigNumber, []>()
const mockBalanceOfCELO = jest.fn<BigNumber, []>()
const mockGetVerifiedStatus = jest.fn<AttestationsStatus, []>()
const mockGetWalletAddress = jest.fn<string, []>()
const mockGetDataEncryptionKey = jest.fn<string, []>()
const mockOdisPaymentsTotalPaidCUSD = jest.fn<BigNumber, []>()

const mockContractKit = createMockContractKit(
  {
    // getWalletAddress stays constant across all old query-quota.test.ts unit tests
    [ContractRetrieval.getAccounts]: createMockAccounts(
      mockGetWalletAddress,
      mockGetDataEncryptionKey
    ),
    [ContractRetrieval.getStableToken]: jest.fn(),
    [ContractRetrieval.getGoldToken]: createMockToken(mockBalanceOfCELO),
    [ContractRetrieval.getAttestations]: createMockAttestation(mockGetVerifiedStatus),
    [ContractRetrieval.getOdisPayments]: createMockOdisPayments(mockOdisPaymentsTotalPaidCUSD),
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

describe('legacyPNP', () => {
  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  const expectedVersion = getVersion()

  // create deep copy
  const _config: typeof config = JSON.parse(JSON.stringify(config))
  _config.db.type = SupportedDatabase.Sqlite
  _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
  _config.api.phoneNumberPrivacy.enabled = true

  beforeAll(async () => {
    keyProvider = await initKeyProvider(_config)
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    db = await initDatabase(_config)
    app = startSigner(_config, db, keyProvider, newKit('dummyKit'))
  })

  afterEach(async () => {
    // Close and destroy the in-memory database.
    // Note: If tests start to be too slow, this could be replaced with more complicated logic to
    // reset the database state without destroying and recreating it for each test.
    await db?.destroy()
  })

  describe(`${SignerEndpoint.STATUS}`, () => {
    it('Should return 200 and correct version', async () => {
      const res = await request(app).get(SignerEndpoint.STATUS)
      expect(res.status).toBe(200)
      expect(res.body.version).toBe(expectedVersion)
    })
  })

  const zeroBalance = new BigNumber(0)
  const twentyCents = new BigNumber(200000000000000000)

  type legacyPnpQuotaCalculationTestCase = {
    it: string
    account: string
    performedQueryCount: number
    transactionCount: number
    balanceCUSD: BigNumber
    balanceCEUR: BigNumber
    balanceCELO: BigNumber
    isVerified: boolean
    identifier: string | undefined
    expectedPerformedQueryCount: number
    expectedTotalQuota: number
  } // To be re-used against both the signature and quota endpoints
  const quotaCalculationTestCases: legacyPnpQuotaCalculationTestCase[] = [
    {
      it: 'should calculate correct quota for verified account',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 2,
      transactionCount: 5,
      balanceCUSD: zeroBalance,
      balanceCEUR: zeroBalance,
      balanceCELO: zeroBalance,
      isVerified: true,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 2,
      expectedTotalQuota: 60,
    },
    {
      it: 'should calculate correct quota for unverified account with no transactions or balance',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 0,
      transactionCount: 0,
      balanceCUSD: zeroBalance,
      balanceCEUR: zeroBalance,
      balanceCELO: zeroBalance,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 0,
      expectedTotalQuota: 0,
    },
    {
      it: 'should calculate correct quota for unverified account with balance but no transactions',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 1,
      transactionCount: 0,
      balanceCUSD: twentyCents,
      balanceCEUR: twentyCents,
      balanceCELO: twentyCents,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 1,
      expectedTotalQuota: 10,
    },
    {
      it: 'should calculate correct quota for verified account with many txs and balance',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 10,
      transactionCount: 100,
      balanceCUSD: twentyCents,
      balanceCEUR: twentyCents,
      balanceCELO: twentyCents,
      isVerified: true,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 10,
      expectedTotalQuota: 440,
    },
    {
      it: 'should calculate correct quota for unverified account with many txs and balance',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 0,
      transactionCount: 100,
      balanceCUSD: twentyCents,
      balanceCEUR: twentyCents,
      balanceCELO: twentyCents,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 0,
      expectedTotalQuota: 410,
    },
    {
      it: 'should calculate correct quota for unverified account without any balance (with txs)',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 0,
      transactionCount: 100,
      balanceCUSD: zeroBalance,
      balanceCEUR: zeroBalance,
      balanceCELO: zeroBalance,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 0,
      expectedTotalQuota: 0,
    },
    {
      it: 'should calculate correct quota for unverified account with only cUSD balance (no txs)',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 1,
      transactionCount: 0,
      balanceCUSD: twentyCents,
      balanceCEUR: zeroBalance,
      balanceCELO: zeroBalance,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 1,
      expectedTotalQuota: 10,
    },
    {
      it: 'should calculate correct quota for unverified account with only cEUR balance (no txs)',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 1,
      transactionCount: 0,
      balanceCUSD: zeroBalance,
      balanceCEUR: twentyCents,
      balanceCELO: zeroBalance,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 1,
      expectedTotalQuota: 10,
    },
    {
      it: 'should calculate correct quota for unverified account with only CELO balance (no txs)',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 1,
      transactionCount: 0,
      balanceCUSD: zeroBalance,
      balanceCEUR: zeroBalance,
      balanceCELO: twentyCents,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 1,
      expectedTotalQuota: 10,
    },
    {
      it:
        'should calculate correct quota for account with min balance when no phone number hash is provided',
      account: ACCOUNT_ADDRESS1,
      performedQueryCount: 1,
      transactionCount: 0,
      balanceCUSD: twentyCents,
      balanceCEUR: twentyCents,
      balanceCELO: twentyCents,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 1,
      expectedTotalQuota: 10,
    },
  ]

  const prepMocks = async (
    account: string,
    performedQueryCount: number,
    transactionCount: number,
    isVerified: boolean,
    balanceCUSD: BigNumber,
    balanceCEUR: BigNumber,
    balanceCELO: BigNumber,
    dekPubKey: string = DEK_PUBLIC_KEY,
    walletAddress: string = mockAccount
  ) => {
    ;[
      mockContractKit.connection.getTransactionCount,
      mockGetVerifiedStatus,
      mockBalanceOfCUSD,
      mockBalanceOfCEUR,
      mockBalanceOfCELO,
      mockGetWalletAddress,
      mockGetDataEncryptionKey,
    ].forEach((mockFn) => mockFn.mockReset())

    await db.transaction(async (trx) => {
      for (let i = 0; i < performedQueryCount; i++) {
        await incrementQueryCount(
          db,
          ACCOUNTS_TABLE_LEGACY,
          account,
          rootLogger(_config.serviceName),
          trx
        )
      }
    })

    mockContractKit.connection.getTransactionCount.mockReturnValue(transactionCount)
    mockGetVerifiedStatus.mockReturnValue(
      // only the isVerified value below matters
      { isVerified, completed: 1, total: 1, numAttestationsRemaining: 1 }
    )
    mockBalanceOfCUSD.mockReturnValue(balanceCUSD)
    mockBalanceOfCEUR.mockReturnValue(balanceCEUR)
    mockBalanceOfCELO.mockReturnValue(balanceCELO)
    mockGetWalletAddress.mockReturnValue(walletAddress)
    mockGetDataEncryptionKey.mockReturnValue(dekPubKey)
  }

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

  describe(`${SignerEndpoint.LEGACY_PNP_QUOTA}`, () => {
    describe('quota calculation logic', () => {
      const runLegacyQuotaTestCase = async (testCase: legacyPnpQuotaCalculationTestCase) => {
        await prepMocks(
          testCase.account,
          testCase.performedQueryCount,
          testCase.transactionCount,
          testCase.isVerified,
          testCase.balanceCUSD,
          testCase.balanceCEUR,
          testCase.balanceCELO
        )

        const req = getPnpQuotaRequest(
          testCase.account,
          AuthenticationMethod.WALLET_KEY,
          testCase.identifier
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: testCase.expectedPerformedQueryCount,
          totalQuota: testCase.expectedTotalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      }

      quotaCalculationTestCases.forEach((testCase) => {
        it(testCase.it, async () => {
          await runLegacyQuotaTestCase(testCase)
        })
      })
    })

    describe('endpoint functionality', () => {
      // Use values from 'unverified account with no transactions' logic test case
      const performedQueryCount = 1
      const expectedQuota = 10

      beforeEach(async () => {
        await prepMocks(
          ACCOUNT_ADDRESS1,
          performedQueryCount,
          0,
          false,
          twentyCents,
          twentyCents,
          twentyCents
        )
      })

      it('Should respond with 200 on valid request', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 on valid request when authenticated with DEK', async () => {
        const req = getPnpQuotaRequest(
          ACCOUNT_ADDRESS1,
          AuthenticationMethod.ENCRYPTION_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)

        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res1 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: res1.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res2.status).toBe(200)
        expect(res2.body).toStrictEqual<PnpQuotaResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })

      it('Should respond with 200 if performedQueryCount is greater than totalQuota', async () => {
        const expectedRemainingQuota = expectedQuota - performedQueryCount
        await db.transaction(async (trx) => {
          for (let i = 0; i <= expectedRemainingQuota; i++) {
            await incrementQueryCount(
              db,
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

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
        const badRequest = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed WALLET_KEY auth', async () => {
        const badRequest = getPnpQuotaRequest(
          ACCOUNT_ADDRESS1,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth', async () => {
        const badRequest = getPnpQuotaRequest(
          ACCOUNT_ADDRESS1,
          AuthenticationMethod.ENCRYPTION_KEY,
          IDENTIFIER
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

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
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(
          req,
          authorization,
          SignerEndpoint.LEGACY_PNP_QUOTA,
          undefined,
          appWithApiDisabled
        )
        expect.assertions(2)
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

          const req = getPnpQuotaRequest(
            ACCOUNT_ADDRESS1,
            AuthenticationMethod.ENCRYPTION_KEY,
            IDENTIFIER
          )

          // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: res.body.version,
            performedQueryCount: performedQueryCount,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
        })

        it('Should respond with 500 on DB performedQueryCount query failure', async () => {
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'getPerformedQueryCount'
            )
            .mockRejectedValueOnce(new Error())

          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT,
          })

          spy.mockRestore()
        })

        it('Should respond with 500 on blockchain totalQuota query failure', async () => {
          mockContractKit.connection.getTransactionCount.mockRejectedValue(new Error())

          const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA,
          })
        })
      })
    })
  })

  describe(`${SignerEndpoint.LEGACY_PNP_SIGN}`, () => {
    describe('quota calculation logic', () => {
      const runLegacyPnpSignQuotaTestCase = async (testCase: legacyPnpQuotaCalculationTestCase) => {
        await prepMocks(
          testCase.account,
          testCase.performedQueryCount,
          testCase.transactionCount,
          testCase.isVerified,
          testCase.balanceCUSD,
          testCase.balanceCEUR,
          testCase.balanceCELO
        )

        const req = getLegacyPnpSignRequest(
          testCase.account,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          testCase.identifier
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

        const { expectedPerformedQueryCount, expectedTotalQuota } = testCase
        const shouldSucceed = expectedPerformedQueryCount < expectedTotalQuota

        if (shouldSucceed) {
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: expectedPerformedQueryCount + 1, // incremented for signature request
            totalQuota: expectedTotalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
        } else {
          expect(res.status).toBe(403)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            performedQueryCount: expectedPerformedQueryCount,
            totalQuota: expectedTotalQuota,
            blockNumber: testBlockNumber,
            error: WarningMessage.EXCEEDED_QUOTA,
          })
        }
      }

      quotaCalculationTestCases.forEach((testCase) => {
        it(testCase.it, async () => {
          await runLegacyPnpSignQuotaTestCase(testCase)
        })
      })
    })

    describe('endpoint functionality', () => {
      // Use values from 'unverified account with balance but no transactions' logic test case
      const performedQueryCount = 1
      const expectedQuota = 10

      beforeEach(async () => {
        await prepMocks(
          ACCOUNT_ADDRESS1,
          performedQueryCount,
          0,
          false,
          twentyCents,
          twentyCents,
          twentyCents
        )
      })

      it('Should respond with 200 on valid request', async () => {
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.ENCRYPTION_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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

      it('Should respond with 200 on valid request with key version header', async () => {
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN, '3') // since default is '1' or '2'
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
        expect(res.get(KEY_VERSION_HEADER)).toEqual('3')
      })

      it('Should respond with 200 and warning on repeated valid requests', async () => {
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
        const res2 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res2.status).toBe(200)
        res1.body.warnings.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
        expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        // @ts-ignore Intentionally deleting required field
        delete badRequest.account
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid key version', async () => {
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(
          badRequest,
          authorization,
          SignerEndpoint.LEGACY_PNP_SIGN,
          'a'
        )
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
      })

      it('Should respond with 400 on invalid identifier', async () => {
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          '+1234567890'
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid blinded message', async () => {
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          '+1234567890',
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid address', async () => {
        const badRequest = getLegacyPnpSignRequest(
          '0xnotanaddress',
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed WALLET_KEY auth', async () => {
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on failed DEK auth', async () => {
        const badRequest = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.ENCRYPTION_KEY,
          IDENTIFIER
        )
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(badRequest, differentPk)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
        await prepMocks(ACCOUNT_ADDRESS1, 0, 0, false, zeroBalance, zeroBalance, zeroBalance)

        const spy = jest // for convenience so we don't have to refactor or reset the db just for this test
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/account'),
            'getPerformedQueryCount'
          )
          .mockResolvedValueOnce(0)

        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName),
              trx
            )
          }
        })

        // It is possible to reach this state due to our fail-open logic

        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
        configWithApiDisabled.api.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(
          req,
          authorization,
          SignerEndpoint.LEGACY_PNP_SIGN,
          undefined,
          appWithApiDisabled
        )
        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })

      describe('interactions between legacy and new endpoints', () => {
        // Keep both of these cases with the legacy test suite
        // since once this endpoint is deprecated, these tests will no longer be needed
        it('Should not be affected by requests and queries from the new endpoint', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(new BigNumber(1e18))
          const expectedQuotaOnChain = 10
          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedQuotaOnChain,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          expect(res.get(KEY_VERSION_HEADER)).toEqual(
            _config.keystore.keys.phoneNumberPrivacy.latest.toString()
          )
          const legacyReq = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const legacyAuthorization = getPnpRequestAuthorization(legacyReq, PRIVATE_KEY1)
          const legacyRes = await sendRequest(
            legacyReq,
            legacyAuthorization,
            SignerEndpoint.LEGACY_PNP_SIGN
          )
          expect(legacyRes.status).toBe(200)
          expect(legacyRes.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: legacyRes.body.version,
            signature: expectedSignature,
            performedQueryCount: performedQueryCount + 1,
            totalQuota: legacyRes.body.totalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          expect(legacyRes.get(KEY_VERSION_HEADER)).toEqual(
            _config.keystore.keys.phoneNumberPrivacy.latest.toString()
          )
        })

        it('Should affect the requests and queries to the new endpoint', async () => {
          const legacyReq = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const legacyAuthorization = getPnpRequestAuthorization(legacyReq, PRIVATE_KEY1)
          const legacyRes = await sendRequest(
            legacyReq,
            legacyAuthorization,
            SignerEndpoint.LEGACY_PNP_SIGN
          )
          expect(legacyRes.status).toBe(200)
          expect(legacyRes.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: legacyRes.body.version,
            signature: expectedSignature,
            performedQueryCount: performedQueryCount + 1,
            totalQuota: legacyRes.body.totalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          expect(legacyRes.get(KEY_VERSION_HEADER)).toEqual(
            _config.keystore.keys.phoneNumberPrivacy.latest.toString()
          )
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(new BigNumber(1e18))
          const expectedQuotaOnChain = 10
          const req = getPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.PNP_SIGN)
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedQuotaOnChain,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          expect(res.get(KEY_VERSION_HEADER)).toEqual(
            _config.keystore.keys.phoneNumberPrivacy.latest.toString()
          )
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
                ACCOUNTS_TABLE_LEGACY,
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
              ACCOUNTS_TABLE_LEGACY,
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

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

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

        it('Should return 200 w/ warning on blockchain totalQuota query failure when shouldFailOpen is true', async () => {
          expect(_config.api.phoneNumberPrivacy.shouldFailOpen).toBe(true)
          // deplete user's quota
          const remainingQuota = expectedQuota - performedQueryCount
          await db.transaction(async (trx) => {
            for (let i = 0; i < remainingQuota; i++) {
              await incrementQueryCount(
                db,
                ACCOUNTS_TABLE_LEGACY,
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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(expectedQuota)

          mockContractKit.connection.getTransactionCount.mockRejectedValue(new Error())

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(expectedQuota + 1)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE_LEGACY,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(_config.serviceName)
            )
          ).toBe(true)
        })

        it('Should return 500 on blockchain totalQuota query failure when shouldFailOpen is false', async () => {
          mockContractKit.connection.getTransactionCount.mockRejectedValue(new Error())

          const configWithFailOpenDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
          configWithFailOpenDisabled.api.phoneNumberPrivacy.shouldFailOpen = false
          const appWithFailOpenDisabled = startSigner(configWithFailOpenDisabled, db, keyProvider)

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(
            req,
            authorization,
            SignerEndpoint.LEGACY_PNP_SIGN,
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
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/database/wrappers/account'),
              'incrementQueryCount'
            )
            .mockRejectedValueOnce(new Error())

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.UNKNOWN_ERROR,
          })

          spy.mockRestore()

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE_LEGACY,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(_config.serviceName)
            )
          ).toBe(false)
        })

        it('Should return 500 on failure to store request', async () => {
          const spy = jest
            .spyOn(jest.requireActual('../../src/common/database/wrappers/request'), 'storeRequest')
            .mockRejectedValueOnce(new Error())

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.UNKNOWN_ERROR,
          })

          spy.mockRestore()

          // check DB state: performedQueryCount was not incremented and request was not stored
          expect(
            await getPerformedQueryCount(
              db,
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE_LEGACY,
              req.account,
              req.blindedQueryPhoneNumber,
              rootLogger(_config.serviceName)
            )
          ).toBe(false)
        })

        it('Should return 200 on failure to fetch DEK', async () => {
          mockGetDataEncryptionKey.mockImplementation(() => {
            throw new Error()
          })

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.ENCRYPTION_KEY,
            IDENTIFIER
          )

          // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
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

        it('Should return 500 on bls signing error', async () => {
          const spy = jest
            .spyOn(jest.requireActual('blind-threshold-bls'), 'partialSignBlindedMessage')
            .mockImplementationOnce(() => {
              throw new Error()
            })

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(_config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE_LEGACY,
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

          const req = getLegacyPnpSignRequest(
            ACCOUNT_ADDRESS1,
            BLINDED_PHONE_NUMBER,
            AuthenticationMethod.WALLET_KEY,
            IDENTIFIER
          )
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)

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
              ACCOUNTS_TABLE_LEGACY,
              ACCOUNT_ADDRESS1,
              rootLogger(config.serviceName)
            )
          ).toBe(performedQueryCount)
          expect(
            await getRequestExists(
              db,
              REQUESTS_TABLE_LEGACY,
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
