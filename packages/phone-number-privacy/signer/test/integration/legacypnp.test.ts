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
  createMockAttestation,
  getLegacyPnpSignRequest,
} from '@celo/phone-number-privacy-common/lib/test/utils'
import { BLINDED_PHONE_NUMBER } from '@celo/phone-number-privacy-common/src/test/values'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import request from 'supertest'
import { initDatabase } from '../../src/common/database/database'
import { incrementQueryCount } from '../../src/common/database/wrappers/account'
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

const expectedSignature =
  'MAAAAAAAAAAEFHu3gWowoNJvvWkINGZR/1no37LPBFYRIHu3h5xYowXo1tlIlrL9CbN0cNqcKIAAAAAA'

const testBlockNumber = 1000000

const mockBalanceOfCUSD = jest.fn<BigNumber, []>()
const mockBalanceOfCEUR = jest.fn<BigNumber, []>()
const mockBalanceOfCELO = jest.fn<BigNumber, []>()
const mockGetVerifiedStatus = jest.fn<AttestationsStatus, []>()

const mockContractKit = createMockContractKit(
  {
    // getWalletAddress stays constant across all old query-quota.test.ts unit tests
    [ContractRetrieval.getAccounts]: createMockAccounts(mockAccount),
    [ContractRetrieval.getStableToken]: jest.fn(),
    [ContractRetrieval.getGoldToken]: createMockToken(mockBalanceOfCELO),
    [ContractRetrieval.getAttestations]: createMockAttestation(mockGetVerifiedStatus),
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

  type legacyPnpQuotaTestCase = {
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
  const quotaCalculationTestCases: legacyPnpQuotaTestCase[] = [
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
      performedQueryCount: 0,
      transactionCount: 0,
      balanceCUSD: twentyCents,
      balanceCEUR: twentyCents,
      balanceCELO: twentyCents,
      isVerified: false,
      identifier: IDENTIFIER,
      expectedPerformedQueryCount: 0,
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
    balanceCELO: BigNumber
  ) => {
    ;[
      mockContractKit.connection.getTransactionCount,
      mockGetVerifiedStatus,
      mockBalanceOfCUSD,
      mockBalanceOfCEUR,
      mockBalanceOfCELO,
    ].forEach((mockFn) => mockFn.mockReset())

    await db.transaction(async (trx) => {
      for (let i = 0; i < performedQueryCount; i++) {
        await incrementQueryCount(db, account, rootLogger(config.serviceName), trx)
      }
    })

    mockContractKit.connection.getTransactionCount.mockReturnValue(transactionCount)
    mockGetVerifiedStatus.mockReturnValue(
      isVerified
        ? { isVerified, completed: 3, total: 3, numAttestationsRemaining: 0 }
        : { isVerified, completed: 2, total: 3, numAttestationsRemaining: 1 }
    )
    mockBalanceOfCUSD.mockReturnValue(balanceCUSD)
    mockBalanceOfCEUR.mockReturnValue(balanceCEUR)
    mockBalanceOfCELO.mockReturnValue(balanceCELO)
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
      const runLegacyQuotaTestCase = async (testCase: legacyPnpQuotaTestCase) => {
        await prepMocks(
          testCase.account,
          testCase.performedQueryCount,
          testCase.transactionCount,
          testCase.isVerified,
          testCase.balanceCUSD,
          testCase.balanceCEUR,
          testCase.balanceCELO
        )

        const req = getPnpQuotaRequest(testCase.account, testCase.identifier)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
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

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

        const res1 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res1.status).toBe(200)
        expect(res1.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res1.body.version,
          performedQueryCount: performedQueryCount,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const res2 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
        expect(res2.status).toBe(200)
        expect(res2.body).toMatchObject<PnpQuotaResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = getPnpQuotaRequest(ACCOUNT_ADDRESS1, IDENTIFIER)
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)
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
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

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
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_QUOTA)

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
        const res = await sendRequest(
          req,
          authorization,
          SignerEndpoint.LEGACY_PNP_QUOTA,
          undefined,
          appWithApiDisabled
        )
        expect.assertions(2)
        expect(res.status).toBe(503)
        expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })

      describe('functionality in case of errors', () => {
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
          expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
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
          expect(res.body).toMatchObject<PnpQuotaResponseFailure>({
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
      const runLegacyPnpSignQuotaTestCase = async (testCase: legacyPnpQuotaTestCase) => {
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
          expect(res.body).toMatchObject<SignMessageResponseSuccess>({
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
          expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
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
        const res = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN, '2')
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: res.body.version,
          signature: expectedSignature,
          performedQueryCount: performedQueryCount + 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        expect(res.get(KEY_VERSION_HEADER)).toEqual('2')
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
        expect(res1.body).toMatchObject<SignMessageResponseSuccess>({
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
        expect(res2.body).toMatchObject<SignMessageResponseSuccess>(res1.body)
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
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid address', async () => {
        const badRequest = getLegacyPnpSignRequest(
          '0xnotanaddress',
          '+1234567890',
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(badRequest, PRIVATE_KEY1)
        const res = await sendRequest(badRequest, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res.status).toBe(400)
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
            await incrementQueryCount(db, ACCOUNT_ADDRESS1, rootLogger(config.serviceName), trx)
          }
        })
        const req = getLegacyPnpSignRequest(
          ACCOUNT_ADDRESS1,
          BLINDED_PHONE_NUMBER,
          AuthenticationMethod.WALLET_KEY,
          IDENTIFIER
        )
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendRequest(req, authorization, SignerEndpoint.LEGACY_PNP_SIGN)
        expect(res1.status).toBe(403)
        expect(res1.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: res1.body.version,
          performedQueryCount: expectedQuota,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled = { ...config }
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
          '1',
          appWithApiDisabled
        )
        expect(res.status).toBe(503)
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })

      describe('functionality in case of errors', () => {
        it('Should return 200 w/ warning on DB performedQueryCount query failure', async () => {
          // deplete user's quota
          const remainingQuota = expectedQuota - performedQueryCount
          await db.transaction(async (trx) => {
            for (let i = 0; i < remainingQuota; i++) {
              await incrementQueryCount(db, ACCOUNT_ADDRESS1, rootLogger(config.serviceName), trx)
            }
          })

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

          expect(res.status).toBe(200)
          expect(res.body).toMatchObject<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [
              ErrorMessage.DATABASE_GET_FAILURE,
              ErrorMessage.FAILURE_TO_GET_PERFORMED_QUERY_COUNT,
            ],
          })

          spy.mockRestore()
        })

        it('Should return 200 w/ warning on blockchain totalQuota query failure', async () => {
          // deplete user's quota
          const remainingQuota = expectedQuota - performedQueryCount
          await db.transaction(async (trx) => {
            for (let i = 0; i < remainingQuota; i++) {
              await incrementQueryCount(db, ACCOUNT_ADDRESS1, rootLogger(config.serviceName), trx)
            }
          })

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
          expect(res.body).toMatchObject<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: expectedQuota + 1, // bc we depleted the user's quota above
            totalQuota: Number.MAX_SAFE_INTEGER,
            blockNumber: testBlockNumber,
            warnings: [ErrorMessage.FAILURE_TO_GET_TOTAL_QUOTA, ErrorMessage.FULL_NODE_ERROR],
          })
        })

        it('Should return 200 w/ warning on failure to increment query count', async () => {
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

          expect(res.status).toBe(200)
          expect(res.body).toMatchObject<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: performedQueryCount, // Not incremented
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [
              ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT,
              ErrorMessage.FAILURE_TO_STORE_REQUEST,
            ],
          })

          spy.mockRestore()
        })

        it('Should return 200 w/ warning on failure to store request', async () => {
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

          expect(res.status).toBe(200)
          expect(res.body).toMatchObject<SignMessageResponseSuccess>({
            success: true,
            version: res.body.version,
            signature: expectedSignature,
            performedQueryCount: performedQueryCount + 1,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            warnings: [ErrorMessage.FAILURE_TO_STORE_REQUEST],
          })

          spy.mockRestore()
        })

        it('Should return 500 on bls signing error', async () => {
          const spy = jest
            .spyOn(
              jest.requireActual('../../src/common/bls/bls-cryptography-client'),
              'computeBlindedSignature'
            )
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
          // TODO(2.0.0)(Alec): investigate whether we have the intended behavior here
          expect(res.body).toMatchObject<SignMessageResponseFailure>({
            success: false,
            version: res.body.version,
            performedQueryCount: performedQueryCount,
            totalQuota: expectedQuota,
            blockNumber: testBlockNumber,
            error: ErrorMessage.SIGNATURE_COMPUTATION_FAILURE,
          })

          spy.mockRestore()
        })
      })
    })
  })
})
