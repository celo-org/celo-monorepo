import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  DB_TIMEOUT,
  ErrorMessage,
  FULL_NODE_TIMEOUT_IN_MS,
  genSessionID,
  KEY_VERSION_HEADER,
  PnpQuotaRequest,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { initDatabase as initSignerDatabase } from '@celo/phone-number-privacy-signer/dist/common/database/database'
import {
  DefaultKeyName,
  KeyProvider,
} from '@celo/phone-number-privacy-signer/dist/common/key-management/key-provider-base'
import { MockKeyProvider } from '@celo/phone-number-privacy-signer/dist/common/key-management/mock-key-provider'
import {
  SignerConfig,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer/dist/config'
import { startSigner } from '@celo/phone-number-privacy-signer/dist/server'
import BigNumber from 'bignumber.js'
import threshold_bls from 'blind-threshold-bls'
import { Server } from 'http'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import request from 'supertest'
import config, { getCombinerVersion } from '../../src/config'
import { startCombiner } from '../../src/server'
import { getBlindedPhoneNumber, serverClose } from '../utils'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockOdisPayments,
  getPnpRequestAuthorization,
} = TestUtils.Utils
const {
  PRIVATE_KEY1,
  ACCOUNT_ADDRESS1,
  mockAccount,
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V1,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V2,
  PNP_THRESHOLD_DEV_PK_SHARE_1_V3,
  PNP_THRESHOLD_DEV_PK_SHARE_2_V1,
  PNP_THRESHOLD_DEV_PK_SHARE_2_V2,
  PNP_THRESHOLD_DEV_PK_SHARE_2_V3,
  PNP_THRESHOLD_DEV_PK_SHARE_3_V1,
  PNP_THRESHOLD_DEV_PK_SHARE_3_V2,
  PNP_THRESHOLD_DEV_PK_SHARE_3_V3,
  ACCOUNT_ADDRESS2,
  BLINDING_FACTOR,
} = TestUtils.Values

jest.setTimeout(20000)

// create deep copy of config
const combinerConfig: typeof config = JSON.parse(JSON.stringify(config))
combinerConfig.phoneNumberPrivacy.enabled = true

const signerConfig: SignerConfig = {
  serviceName: 'odis-signer',
  server: {
    port: undefined,
    sslKeyPath: undefined,
    sslCertPath: undefined,
  },
  quota: {
    unverifiedQueryMax: 10,
    additionalVerifiedQueryMax: 30,
    queryPerTransaction: 2,
    // Min balance is .01 cUSD
    minDollarBalance: new BigNumber(1e16),
    // Min balance is .01 cEUR
    minEuroBalance: new BigNumber(1e16),
    // Min balance is .005 CELO
    minCeloBalance: new BigNumber(5e15),
    // Equivalent to 0.001 cUSD/query
    queryPriceInCUSD: new BigNumber(0.001),
  },
  api: {
    domains: {
      enabled: false,
    },
    phoneNumberPrivacy: {
      enabled: true,
    },
  },
  blockchain: {
    provider: 'https://alfajores-forno.celo-testnet.org',
    apiKey: undefined,
  },
  db: {
    type: SupportedDatabase.Sqlite,
    user: '',
    password: '',
    database: '',
    host: 'http://localhost',
    port: undefined,
    ssl: true,
    poolMaxSize: 50,
    timeout: DB_TIMEOUT,
  },
  keystore: {
    type: SupportedKeystore.MOCK_SECRET_MANAGER,
    keys: {
      phoneNumberPrivacy: {
        name: 'phoneNumberPrivacy',
        latest: 2,
      },
      domains: {
        name: 'domains',
        latest: 1,
      },
    },
    azure: {
      clientID: '',
      clientSecret: '',
      tenant: '',
      vaultName: '',
    },
    google: {
      projectId: '',
    },
    aws: {
      region: '',
      secretKey: '',
    },
  },
  timeout: 5000,
  test_quota_bypass_percentage: 0,
  fullNodeTimeoutMs: FULL_NODE_TIMEOUT_IN_MS,
  fullNodeRetryCount: RETRY_COUNT,
  fullNodeRetryDelayMs: RETRY_DELAY_IN_MS,
  // TODO (alec) make SignerConfig better
  shouldMockAccountService: false,
  mockDek: '',
  mockTotalQuota: 0,
  shouldMockRequestService: false,
  requestPrunningDays: 0,
  requestPrunningAtServerStart: false,
  requestPrunningJobCronPattern: '0 0 0 * * *',
}

const mockOdisPaymentsTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockGetWalletAddress = jest.fn<string, []>()
const mockGetDataEncryptionKey = jest.fn<string, []>()

const mockContractKit = createMockContractKit({
  [ContractRetrieval.getAccounts]: createMockAccounts(
    mockGetWalletAddress,
    mockGetDataEncryptionKey
  ),
  [ContractRetrieval.getOdisPayments]: createMockOdisPayments(mockOdisPaymentsTotalPaidCUSD),
})

// Mock newKit as opposed to the CK constructor
// Returns an object of type ContractKit that can be passed into the signers + combiner
jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  newKit: jest.fn().mockImplementation(() => mockContractKit),
}))

describe('pnpService', () => {
  let keyProvider1: KeyProvider
  let keyProvider2: KeyProvider
  let keyProvider3: KeyProvider
  let signerDB1: Knex
  let signerDB2: Knex
  let signerDB3: Knex
  let signer1: Server | HttpsServer
  let signer2: Server | HttpsServer
  let signer3: Server | HttpsServer
  let app: any

  // Used by PNP_SIGN tests for various configurations of signers
  let userSeed: Uint8Array
  let blindedMsgResult: threshold_bls.BlindedMessage

  const signerMigrationsPath = '../signer/dist/common/database/migrations'
  const expectedVersion = getCombinerVersion()

  const onChainPaymentsDefault = new BigNumber(1e18)
  const expectedTotalQuota = 1000

  const message = Buffer.from('test message', 'utf8')

  // In current setup, the same mocked kit is used for the combiner and signers
  const mockKit = newKit('dummyKit')

  const sendPnpSignRequest = async (
    req: SignMessageRequest,
    authorization: string,
    app: any,
    keyVersionHeader?: string
  ) => {
    let reqWithHeaders = request(app)
      .post(CombinerEndpoint.PNP_SIGN)
      .set('Authorization', authorization)

    if (keyVersionHeader) {
      reqWithHeaders = reqWithHeaders.set(KEY_VERSION_HEADER, keyVersionHeader)
    }
    return reqWithHeaders.send(req)
  }

  const getSignRequest = (_blindedMsgResult: threshold_bls.BlindedMessage): SignMessageRequest => {
    return {
      account: ACCOUNT_ADDRESS1,
      blindedQueryPhoneNumber: Buffer.from(_blindedMsgResult.message).toString('base64'),
      sessionID: genSessionID(),
    }
  }

  const useQuery = async (performedQueryCount: number, signer: Server | HttpsServer) => {
    for (let i = 0; i < performedQueryCount; i++) {
      const phoneNumber = '+1' + Math.floor(Math.random() * 10 ** 10)
      const blindedNumber = getBlindedPhoneNumber(phoneNumber, BLINDING_FACTOR)
      const req = {
        account: ACCOUNT_ADDRESS1,
        blindedQueryPhoneNumber: blindedNumber,
      }
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      await request(signer)
        .post(SignerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)
    }
  }

  const getCombinerQuotaResponse = async (
    req: PnpQuotaRequest,
    authorization: string,
    _app: any = app
  ) => {
    const res = await request(_app)
      .post(CombinerEndpoint.PNP_QUOTA)
      .set('Authorization', authorization)
      .send(req)
    return res
  }

  describe('with n=3, t=2', () => {
    const expectedSignatures: string[] = [
      'xgFMQtcgAMHJAEX/m9B4VFopYtxqPFSw0024sWzRYvQDvnmFqhXOPdnRDfa8WCEA',
      'wUuFV8yFBXGyEzKbyWjBChG6dER264nwjOsqErd/UZieVKE0oDMZcMDG+qObu4QB',
      'PJHqBGavcQG3NGFl3hiR8GymeDNumxbl1DnCJzWz+Ik5yCN2ZpAITBe24RTX0iMA',
    ]
    const expectedSignature = expectedSignatures[config.phoneNumberPrivacy.keys.currentVersion - 1]

    const expectedUnblindedSigs: string[] = [
      'lOASnDJNbJBTMYfkbU4fMiK7FcNwSyqZo8iQSM95X8YK+/158be4S1A+jcQsCUYA',
      'QIT7HtHTe/d0Tq40Mf3rpHCT8qY20+8q7ZW9PXHFMWGvwSGhk7l3Pfwnx8YdXomB',
      'XW//DolLzaXYS/gk9WBHfeKy5HKrGjuF/OpCok/i6fprE4AGFH2PjE7zeKTfOQ+A',
    ]
    const expectedUnblindedSig =
      expectedUnblindedSigs[config.phoneNumberPrivacy.keys.currentVersion - 1]

    beforeAll(async () => {
      keyProvider1 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, PNP_THRESHOLD_DEV_PK_SHARE_1_V1],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-2`, PNP_THRESHOLD_DEV_PK_SHARE_1_V2],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-3`, PNP_THRESHOLD_DEV_PK_SHARE_1_V3],
        ])
      )
      keyProvider2 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, PNP_THRESHOLD_DEV_PK_SHARE_2_V1],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-2`, PNP_THRESHOLD_DEV_PK_SHARE_2_V2],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-3`, PNP_THRESHOLD_DEV_PK_SHARE_2_V3],
        ])
      )
      keyProvider3 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, PNP_THRESHOLD_DEV_PK_SHARE_3_V1],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-2`, PNP_THRESHOLD_DEV_PK_SHARE_3_V2],
          [`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-3`, PNP_THRESHOLD_DEV_PK_SHARE_3_V3],
        ])
      )
      app = startCombiner(combinerConfig, mockKit)
    })

    beforeEach(async () => {
      signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

      userSeed = new Uint8Array(32)
      for (let i = 0; i < userSeed.length - 1; i++) {
        userSeed[i] = i
      }

      blindedMsgResult = threshold_bls.blind(message, userSeed)

      mockGetDataEncryptionKey.mockReset().mockReturnValue(DEK_PUBLIC_KEY)
      mockGetWalletAddress.mockReset().mockReturnValue(mockAccount)
    })

    afterEach(async () => {
      await serverClose(signer1)
      await serverClose(signer2)
      await serverClose(signer3)
      await signerDB1?.destroy()
      await signerDB2?.destroy()
      await signerDB3?.destroy()
    })

    describe('when signers are operating correctly', () => {
      beforeEach(async () => {
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
        signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
        signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
      })

      describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
        const totalQuota = 10
        const weiTocusd = new BigNumber(1e18)
        beforeAll(async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(
            weiTocusd.multipliedBy(totalQuota).multipliedBy(signerConfig.quota.queryPriceInCUSD)
          )
        })

        const queryCountParams = [
          { signerQueries: [0, 0, 0], expectedQueryCount: 0, expectedWarnings: [] },
          {
            signerQueries: [1, 0, 0],
            expectedQueryCount: 0,
            expectedWarnings: [WarningMessage.SIGNER_RESPONSE_DISCREPANCIES],
          }, // does not reach threshold
          {
            signerQueries: [1, 1, 0],
            expectedQueryCount: 1,
            expectedWarnings: [WarningMessage.SIGNER_RESPONSE_DISCREPANCIES],
          }, // threshold reached
          {
            signerQueries: [0, 1, 1],
            expectedQueryCount: 1,
            expectedWarnings: [WarningMessage.SIGNER_RESPONSE_DISCREPANCIES],
          }, // order of signers shouldn't matter
          {
            signerQueries: [1, 4, 9],
            expectedQueryCount: 4,
            expectedWarnings: [
              WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
              WarningMessage.INCONSISTENT_SIGNER_QUERY_MEASUREMENTS,
            ],
          },
        ]
        queryCountParams.forEach(({ signerQueries, expectedQueryCount, expectedWarnings }) => {
          it(`should get ${expectedQueryCount} performedQueryCount given signer responses of ${signerQueries}`, async () => {
            await useQuery(signerQueries[0], signer1)
            await useQuery(signerQueries[1], signer2)
            await useQuery(signerQueries[2], signer3)

            const req = {
              account: ACCOUNT_ADDRESS1,
            }
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await getCombinerQuotaResponse(req, authorization)

            expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
              success: true,
              version: expectedVersion,
              performedQueryCount: expectedQueryCount,
              totalQuota,

              warnings: expectedWarnings,
            })
          })
        })

        it('Should respond with 200 on valid request', async () => {
          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota,

            warnings: [],
          })
        })

        it('Should respond with 200 on repeated valid requests', async () => {
          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res1 = await getCombinerQuotaResponse(req, authorization)
          expect(res1.status).toBe(200)
          expect(res1.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota,

            warnings: [],
          })
          const res2 = await getCombinerQuotaResponse(req, authorization)
          expect(res2.status).toBe(200)
          expect(res2.body).toStrictEqual<PnpQuotaResponseSuccess>(res1.body)
        })

        it('Should respond with 200 on extra request fields', async () => {
          const req = {
            account: ACCOUNT_ADDRESS1,
            extraField: 'dummy',
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota,

            warnings: [],
          })
        })

        it('Should respond with 200 when authenticated with DEK', async () => {
          const req = {
            account: ACCOUNT_ADDRESS1,
            authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
          }
          const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota,

            warnings: [],
          })
        })

        it('Should respond with a warning when there are slight discrepancies in total quota', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValueOnce(
            weiTocusd.multipliedBy(totalQuota + 1).multipliedBy(signerConfig.quota.queryPriceInCUSD)
          )
          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
            success: true,
            version: expectedVersion,
            performedQueryCount: 0,
            totalQuota,

            warnings: [
              WarningMessage.SIGNER_RESPONSE_DISCREPANCIES,
              WarningMessage.INCONSISTENT_SIGNER_QUOTA_MEASUREMENTS +
                ', using threshold signer as best guess',
            ],
          })
        })

        it('Should respond with 500 when there are large discrepancies in total quota', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValueOnce(weiTocusd.multipliedBy(totalQuota + 15))
          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)
          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
          })
        })

        it('Should respond with 400 on missing request fields', async () => {
          // @ts-ignore Intentionally missing required fields
          const req: PnpQuotaRequest = {}
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(400)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.INVALID_INPUT,
          })
        })

        it('Should respond with 400 with invalid address', async () => {
          const req = {
            account: 'not an address',
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(400)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.INVALID_INPUT,
          })
        })

        it('Should respond with 401 on failed WALLET_KEY auth', async () => {
          // Request from one account, signed by another account
          const req = {
            account: ACCOUNT_ADDRESS2,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(401)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.UNAUTHENTICATED_USER,
          })
        })

        it('Should respond with 401 on failed DEK auth', async () => {
          const req = {
            account: ACCOUNT_ADDRESS2,
            AuthenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(401)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.UNAUTHENTICATED_USER,
          })
        })

        // This previously returned 502 instead of 500
        it('Should respond with 500 when insufficient signer responses', async () => {
          await serverClose(signer1)
          await serverClose(signer2)
          await signerDB1?.destroy()
          await signerDB2?.destroy()

          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await getCombinerQuotaResponse(req, authorization)

          expect(res.status).toBe(500)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
          })
        })

        it('Should respond with 503 on disabled api', async () => {
          const configWithApiDisabled: typeof combinerConfig = JSON.parse(
            JSON.stringify(combinerConfig)
          )
          configWithApiDisabled.phoneNumberPrivacy.enabled = false
          const appWithApiDisabled = startCombiner(configWithApiDisabled, mockKit)
          const req = {
            account: ACCOUNT_ADDRESS1,
          }
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await request(appWithApiDisabled)
            .post(CombinerEndpoint.PNP_QUOTA)
            .set('Authorization', authorization)
            .send(req)
          expect(res.status).toBe(503)
          expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.API_UNAVAILABLE,
          })
        })
      })

      describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
        let req: SignMessageRequest

        beforeEach(async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainPaymentsDefault)
          req = getSignRequest(blindedMsgResult)
        })

        it('Should respond with 200 on valid request', async () => {
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          })
          const unblindedSig = threshold_bls.unblind(
            Buffer.from(res.body.signature, 'base64'),
            blindedMsgResult.blindingFactor
          )

          expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedSig)
        })

        for (let i = 1; i <= 3; i++) {
          it(`Should respond with 200 on valid request with key version header ${i}`, async () => {
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app, i.toString())

            expect(res.status).toBe(200)
            expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
              success: true,
              version: expectedVersion,
              signature: expectedSignatures[i - 1],
              performedQueryCount: 1,
              totalQuota: expectedTotalQuota,

              warnings: [],
            })

            const unblindedSig = threshold_bls.unblind(
              Buffer.from(res.body.signature, 'base64'),
              blindedMsgResult.blindingFactor
            )

            expect(Buffer.from(unblindedSig).toString('base64')).toEqual(
              expectedUnblindedSigs[i - 1]
            )
          })
        }

        it('Should respond with 200 on repeated valid requests', async () => {
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res1 = await sendPnpSignRequest(req, authorization, app)
          const expectedResponse: SignMessageResponseSuccess = {
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          }

          expect(res1.status).toBe(200)
          expect(res1.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)

          const res2 = await sendPnpSignRequest(req, authorization, app)
          expect(res2.status).toBe(200)
          // Do not expect performedQueryCount to increase since this is a duplicate request
          expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)
        })

        it('Should increment performedQueryCount on request from the same account with a new message', async () => {
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res1 = await sendPnpSignRequest(req, authorization, app)
          const expectedResponse: SignMessageResponseSuccess = {
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          }

          expect(res1.status).toBe(200)
          expect(res1.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)

          // Second request for the same account but with new message
          const message2 = Buffer.from('second test message', 'utf8')
          const blindedMsg2 = threshold_bls.blind(message2, userSeed)
          const req2 = getSignRequest(blindedMsg2)
          const authorization2 = getPnpRequestAuthorization(req2, PRIVATE_KEY1)

          // Expect performedQueryCount to increase
          expectedResponse.performedQueryCount++
          expectedResponse.signature =
            'PWvuSYIA249x1dx+qzgl6PKSkoulXXE/P4WHJvGmtw77pCRilEWTn3xSp+6JS9+A'
          const res2 = await sendPnpSignRequest(req2, authorization2, app)
          expect(res2.status).toBe(200)
          expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)
        })

        it('Should respond with 200 on extra request fields', async () => {
          // @ts-ignore Intentionally adding an extra field to the request type
          req.extraField = 'dummyString'
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          })
        })

        it('Should respond with 200 when authenticated with DEK', async () => {
          req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
          const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          })
        })

        it('Should respond with 200 on invalid key version', async () => {
          req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
          const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
          const res = await sendPnpSignRequest(req, authorization, app, 'invalid')

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          })
        })

        it('Should get the same unblinded signatures from the same message (different seed)', async () => {
          const authorization1 = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res1 = await sendPnpSignRequest(req, authorization1, app)

          expect(res1.status).toBe(200)
          expect(res1.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSignature,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,

            warnings: [],
          })

          const secondUserSeed = new Uint8Array(userSeed)
          secondUserSeed[0]++
          // Ensure request is identical except for blinded message
          const req2 = { ...req }
          const blindedMsgResult2 = threshold_bls.blind(message, secondUserSeed)
          req2.blindedQueryPhoneNumber = Buffer.from(blindedMsgResult2.message).toString('base64')

          // Sanity check
          expect(req2.blindedQueryPhoneNumber).not.toEqual(req.blindedQueryPhoneNumber)

          const authorization2 = getPnpRequestAuthorization(req2, PRIVATE_KEY1)
          const res2 = await sendPnpSignRequest(req2, authorization2, app)
          expect(res2.status).toBe(200)
          const unblindedSig1 = threshold_bls.unblind(
            Buffer.from(res1.body.signature, 'base64'),
            blindedMsgResult.blindingFactor
          )
          const unblindedSig2 = threshold_bls.unblind(
            Buffer.from(res2.body.signature, 'base64'),
            blindedMsgResult2.blindingFactor
          )
          expect(Buffer.from(unblindedSig1).toString('base64')).toEqual(expectedUnblindedSig)
          expect(unblindedSig1).toEqual(unblindedSig2)
        })

        it('Should respond with 400 on missing request fields', async () => {
          // @ts-ignore Intentionally deleting required field
          delete req.account
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(400)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.INVALID_INPUT,
          })
        })

        it('Should respond with 400 on unsupported key version', async () => {
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app, '4')
          expect(res.status).toBe(400)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
          })
        })

        it('Should respond with 401 on failed WALLET_KEY auth', async () => {
          req.account = mockAccount
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(401)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.UNAUTHENTICATED_USER,
          })
        })

        it('Should respond with 401 on failed DEK auth', async () => {
          req.account = mockAccount
          req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(401)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.UNAUTHENTICATED_USER,
          })
        })

        it('Should respond with 403 on out of quota', async () => {
          mockOdisPaymentsTotalPaidCUSD.mockReturnValue(new BigNumber(0))
          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(403)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.EXCEEDED_QUOTA,
          })
        })

        it('Should respond with 503 on disabled api', async () => {
          const configWithApiDisabled: typeof combinerConfig = JSON.parse(
            JSON.stringify(combinerConfig)
          )
          configWithApiDisabled.phoneNumberPrivacy.enabled = false
          const appWithApiDisabled = startCombiner(configWithApiDisabled, mockKit)

          const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
          const res = await sendPnpSignRequest(req, authorization, appWithApiDisabled)

          expect(res.status).toBe(503)
          expect(res.body).toStrictEqual<SignMessageResponseFailure>({
            success: false,
            version: expectedVersion,
            error: WarningMessage.API_UNAVAILABLE,
          })
        })

        describe('functionality in case of errors', () => {
          it('Should return 401 on failure to fetch DEK', async () => {
            mockGetDataEncryptionKey.mockImplementation(() => {
              throw new Error()
            })

            req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)

            const combinerConfigWithFailOpenDisabled: typeof combinerConfig = JSON.parse(
              JSON.stringify(combinerConfig)
            )
            const appWithFailOpenDisabled = startCombiner(
              combinerConfigWithFailOpenDisabled,
              mockKit
            )
            const res = await sendPnpSignRequest(req, authorization, appWithFailOpenDisabled)

            expect(res.status).toBe(401)
            expect(res.body).toStrictEqual<SignMessageResponseFailure>({
              success: false,
              version: expectedVersion,
              error: WarningMessage.UNAUTHENTICATED_USER,
            })
          })
        })
      })
    })

    // For testing combiner code paths when signers do not behave as expected
    describe('when signers are not operating correctly', () => {
      beforeEach(() => {
        mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainPaymentsDefault)
      })

      describe('when 2/3 signers return correct signatures', () => {
        beforeEach(async () => {
          const badBlsShare1 =
            '000000002e50aa714ef6b865b5de89c56969ef9f8f27b6b0a6d157c9cc01c574ac9df604'

          const badKeyProvider1 = new MockKeyProvider(
            new Map([[`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, badBlsShare1]])
          )
          signer1 = startSigner(signerConfig, signerDB1, badKeyProvider1, mockKit).listen(3001)
          signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
          signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
        })

        describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
          it('Should respond with 200 on valid request', async () => {
            const req = getSignRequest(blindedMsgResult)
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app)

            expect(res.status).toBe(200)
            expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
              success: true,
              version: expectedVersion,
              signature: expectedSignature,
              performedQueryCount: 1,
              totalQuota: expectedTotalQuota,

              warnings: [],
            })
            const unblindedSig = threshold_bls.unblind(
              Buffer.from(res.body.signature, 'base64'),
              blindedMsgResult.blindingFactor
            )
            expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedSig)
          })
        })
      })

      describe('when 1/3 signers return correct signatures', () => {
        beforeEach(async () => {
          const badBlsShare1 =
            '000000002e50aa714ef6b865b5de89c56969ef9f8f27b6b0a6d157c9cc01c574ac9df604'
          const badBlsShare2 =
            '01000000b8f0ef841dcf8d7bd1da5e8025e47d729eb67f513335784183b8fa227a0b9a0b'

          const badKeyProvider1 = new MockKeyProvider(
            new Map([[`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, badBlsShare1]])
          )

          const badKeyProvider2 = new MockKeyProvider(
            new Map([[`${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`, badBlsShare2]])
          )

          signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
          signer2 = startSigner(signerConfig, signerDB2, badKeyProvider1, mockKit).listen(3002)
          signer3 = startSigner(signerConfig, signerDB3, badKeyProvider2, mockKit).listen(3003)
        })

        describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
          it('Should respond with 500 even if request is valid', async () => {
            const req = getSignRequest(blindedMsgResult)
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app)

            expect(res.status).toBe(500)
            expect(res.body).toStrictEqual<SignMessageResponseFailure>({
              success: false,
              version: expectedVersion,
              error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
            })
          })
        })
      })

      describe('when 2/3 of signers are disabled', () => {
        beforeEach(async () => {
          const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
          configWithApiDisabled.api.phoneNumberPrivacy.enabled = false
          signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
          signer2 = startSigner(configWithApiDisabled, signerDB2, keyProvider2, mockKit).listen(
            3002
          )
          signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3, mockKit).listen(
            3003
          )
        })

        describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
          it('Should fail to reach threshold of signers on valid request', async () => {
            const req = {
              account: ACCOUNT_ADDRESS1,
            }
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await getCombinerQuotaResponse(req, authorization)
            expect(res.status).toBe(503) // majority error code in this case
            expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
              success: false,
              version: expectedVersion,
              error: ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
            })
          })
        })

        describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
          it('Should fail to reach threshold of signers on valid request', async () => {
            const req = getSignRequest(blindedMsgResult)
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app)

            expect(res.status).toBe(503) // majority error code in this case
            expect(res.body).toStrictEqual<SignMessageResponseFailure>({
              success: false,
              version: expectedVersion,
              error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
            })
          })
        })
      })

      describe('when 1/3 of signers are disabled', () => {
        beforeEach(async () => {
          const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
          configWithApiDisabled.api.phoneNumberPrivacy.enabled = false
          signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
          signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
          signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3, mockKit).listen(
            3003
          )
        })

        describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
          it('Should respond with 200 on valid request', async () => {
            const req = {
              account: ACCOUNT_ADDRESS1,
            }
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await getCombinerQuotaResponse(req, authorization)
            expect(res.status).toBe(200)
            expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
              success: true,
              version: expectedVersion,
              performedQueryCount: 0,
              totalQuota: expectedTotalQuota,

              warnings: [],
            })
          })
        })

        describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
          it('Should respond with 200 on valid request', async () => {
            const req = getSignRequest(blindedMsgResult)
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app)
            expect(res.status).toBe(200)
            expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
              success: true,
              version: expectedVersion,
              signature: expectedSignature,
              performedQueryCount: 1,
              totalQuota: expectedTotalQuota,

              warnings: [],
            })
          })
        })
      })

      describe('when signers timeout', () => {
        beforeEach(async () => {
          const testTimeoutMS = 0

          const configWithShortTimeout: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
          configWithShortTimeout.timeout = testTimeoutMS
          // Test this with all signers timing out to decrease possibility of race conditions
          signer1 = startSigner(configWithShortTimeout, signerDB1, keyProvider1, mockKit).listen(
            3001
          )
          signer2 = startSigner(configWithShortTimeout, signerDB2, keyProvider2, mockKit).listen(
            3002
          )
          signer3 = startSigner(configWithShortTimeout, signerDB3, keyProvider3, mockKit).listen(
            3003
          )
        })

        describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
          it('Should fail to reach threshold of signers on valid request', async () => {
            const req = {
              account: ACCOUNT_ADDRESS1,
            }
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await getCombinerQuotaResponse(req, authorization)
            expect(res.status).toBe(500)
            expect(res.body).toStrictEqual<PnpQuotaResponseFailure>({
              success: false,
              version: expectedVersion,
              error: ErrorMessage.THRESHOLD_PNP_QUOTA_STATUS_FAILURE,
            })
          })
        })

        describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
          it('Should fail to reach threshold of signers on valid request', async () => {
            const req = getSignRequest(blindedMsgResult)
            const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
            const res = await sendPnpSignRequest(req, authorization, app)
            expect(res.status).toBe(500)
            expect(res.body).toStrictEqual<SignMessageResponseFailure>({
              success: false,
              version: expectedVersion,
              error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
            })
          })
        })
      })
    })
  })

  // Ensure the same behavior when a minority of signers can block the threshold.
  // On failure, the majority error code should not reflect the abort.
  describe('with n=5, t=4', () => {
    let keyProvider4: KeyProvider
    let keyProvider5: KeyProvider
    let signerDB4: Knex
    let signerDB5: Knex
    let signer4: Server | HttpsServer
    let signer5: Server | HttpsServer

    const combinerConfigLargerN: typeof config = JSON.parse(JSON.stringify(combinerConfig))
    combinerConfigLargerN.phoneNumberPrivacy.odisServices.signers = JSON.stringify([
      {
        url: 'http://localhost:3001',
        fallbackUrl: 'http://localhost:3001/fallback',
      },
      {
        url: 'http://localhost:3002',
        fallbackUrl: 'http://localhost:3002/fallback',
      },
      {
        url: 'http://localhost:3003',
        fallbackUrl: 'http://localhost:3003/fallback',
      },
      {
        url: 'http://localhost:3004',
        fallbackUrl: 'http://localhost:3004/fallback',
      },
      {
        url: 'http://localhost:3005',
        fallbackUrl: 'http://localhost:3005/fallback',
      },
    ])
    combinerConfigLargerN.phoneNumberPrivacy.keys.versions = JSON.stringify([
      {
        keyVersion: 1,
        threshold: 4,
        polynomial:
          '04000000000000007e196818fb4a5677ab97ef04a8b6e188e253d822c0689e37626fe9690d3a60283e74f2c38ec768f32870d73c7e11ff005ad65aa45707922dfc78d1fd54d64200da22a87d82b93783e2f9ee83ec290e25951c0dac2fb856871eba991731367a80b5f92e54b90901594c5e4d56beb15c44a437e78b90eb01bd4770b9c130feaf42c68d28d4e51415949d692936d3689e000f192e4fdcb03d45d1ffcd3615132046a3c8400e30cecaedf8d9bf275ead903e06ef0552a8326159f5361f8c8d16208197367a3115d3f15651082337e125005814a3f94c307e2205864803cc45dbb1b7e11738edec1d0630973830d0a74d0e0113c6ab677f087fb919728b8e1cb4f0004c6b59b4dcf28be7b4b9a5e9522e216b4d70278eff131717ff121b4203a2668093c54c6287cf9b09dd611627872f40f018f7e5a63eed5c94ead63fcd59515b1b8948482a5b7bdf07f91014d0097bba009316a8219c2074d16de09d557c2e7109112ade0d3f68248df7acfbbc4891acbb313d20021be70664d7a114a7fa6d9e01',
        pubKey:
          'fhloGPtKVnerl+8EqLbhiOJT2CLAaJ43Ym/paQ06YCg+dPLDjsdo8yhw1zx+Ef8AWtZapFcHki38eNH9VNZCANoiqH2CuTeD4vnug+wpDiWVHA2sL7hWhx66mRcxNnqA',
      },
    ])

    beforeAll(async () => {
      keyProvider1 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`,
            '00000000a49c8a293839ccb24bbcc7b833b0d57fe2f6087d33271750e7d6cf40897f520c',
          ],
        ])
      )
      keyProvider2 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`,
            '01000000c0866754b43a0e7c6f86c6732c1bc1bc1900f71a0ccab81fcd4048c5ff2edb02',
          ],
        ])
      )
      keyProvider3 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`,
            '02000000c24271a9dd0827e2939e5afbd5cd1c6705fa40d6e962fb288bbc7201921efa10',
          ],
        ])
      )
      keyProvider4 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`,
            '030000006320e2a99d4ce6a491a6354feda06051966a056dffbb0e7c8431b246d863ac09',
          ],
        ])
      )
      keyProvider5 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.PHONE_NUMBER_PRIVACY}-1`,
            '04000000606ff4d6ddae61ac454009af2a49aeb4c297410ef9d3f3ab751c1c4fe5a99c0a',
          ],
        ])
      )
      app = startCombiner(combinerConfigLargerN, mockKit)
    })

    let req: SignMessageRequest

    beforeEach(async () => {
      signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB4 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB5 = await initSignerDatabase(signerConfig, signerMigrationsPath)

      signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
      signer4 = startSigner(signerConfig, signerDB4, keyProvider4, mockKit).listen(3004)
      signer5 = startSigner(signerConfig, signerDB5, keyProvider5, mockKit).listen(3005)

      userSeed = new Uint8Array(32)
      for (let i = 0; i < userSeed.length - 1; i++) {
        userSeed[i] = i
      }

      blindedMsgResult = threshold_bls.blind(message, userSeed)
      req = getSignRequest(blindedMsgResult)
    })

    afterEach(async () => {
      await serverClose(signer1)
      await serverClose(signer2)
      await serverClose(signer3)
      await serverClose(signer4)
      await serverClose(signer5)
      await signerDB1?.destroy()
      await signerDB2?.destroy()
      await signerDB3?.destroy()
      await signerDB4?.destroy()
      await signerDB5?.destroy()
    })

    it('Should respond with 200 on valid request', async () => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainPaymentsDefault)

      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: res.body.signature,
        performedQueryCount: 1,
        totalQuota: expectedTotalQuota,
        warnings: [],
      })
      threshold_bls.unblind(
        Buffer.from(res.body.signature, 'base64'),
        blindedMsgResult.blindingFactor
      )
    })

    it('Should respond with 403 on out of quota', async () => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(new BigNumber(0))

      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(403)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.EXCEEDED_QUOTA,
      })
    })
  })
})
