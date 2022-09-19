import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  ErrorMessage,
  genSessionID,
  KEY_VERSION_HEADER,
  PnpQuotaRequest,
  PnpQuotaResponseFailure,
  PnpQuotaResponseSuccess,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import {
  initDatabase as initSignerDatabase,
  startSigner,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer'
import { KeyProvider } from '@celo/phone-number-privacy-signer/src/common/key-management/key-provider-base'
import { MockKeyProvider } from '@celo/phone-number-privacy-signer/src/common/key-management/mock-key-provider'
import { getVersion, SignerConfig } from '@celo/phone-number-privacy-signer/src/config'
import BigNumber from 'bignumber.js'
import threshold_bls from 'blind-threshold-bls'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import { Server } from 'net'
import request from 'supertest'
import config from '../../src/config'
import { startCombiner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockOdisPayments,
  createMockWeb3,
  getPnpRequestAuthorization,
  getBlindedPhoneNumber,
} = TestUtils.Utils
const {
  PRIVATE_KEY1,
  ACCOUNT_ADDRESS1,
  mockAccount,
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
  BLS_THRESHOLD_DEV_PK_SHARE_1,
  BLS_THRESHOLD_DEV_PK_SHARE_2,
  BLS_THRESHOLD_DEV_PK_SHARE_3,
  ACCOUNT_ADDRESS2,
  BLINDING_FACTOR,
} = TestUtils.Values

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
    // Equivalent to 0.1 cUSD/query
    queryPriceInCUSD: new BigNumber(0.1),
  },
  api: {
    domains: {
      enabled: false,
    },
    phoneNumberPrivacy: {
      enabled: true,
      shouldFailOpen: true,
    },
  },
  attestations: {
    numberAttestationsRequired: 3,
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
      secretName: '',
    },
    google: {
      projectId: '',
      secretName: '',
      secretVersion: 'latest',
    },
    aws: {
      region: '',
      secretName: '',
      secretKey: '',
    },
  },
  timeout: 5000,
  test_quota_bypass_percentage: 0,
}

const testBlockNumber = 1000000

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

  const signerMigrationsPath = '../signer/src/common/database/migrations'
  const expectedVersion = getVersion()

  const onChainPaymentsDefault = new BigNumber(1e18)
  const expectedTotalQuota = 10

  const message = Buffer.from('test message', 'utf8')
  const expectedSig = 'xgFMQtcgAMHJAEX/m9B4VFopYtxqPFSw0024sWzRYvQDvnmFqhXOPdnRDfa8WCEA'
  const expectedUnblindedMsg = 'lOASnDJNbJBTMYfkbU4fMiK7FcNwSyqZo8iQSM95X8YK+/158be4S1A+jcQsCUYA'

  // In current setup, the same mocked kit is used for the combiner and signers
  const mockKit = newKit('dummyKit')

  beforeAll(async () => {
    keyProvider1 = new MockKeyProvider(BLS_THRESHOLD_DEV_PK_SHARE_1)
    keyProvider2 = new MockKeyProvider(BLS_THRESHOLD_DEV_PK_SHARE_2)
    keyProvider3 = new MockKeyProvider(BLS_THRESHOLD_DEV_PK_SHARE_3)
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
    await signerDB1?.destroy()
    await signerDB2?.destroy()
    await signerDB3?.destroy()
    signer1?.close()
    signer2?.close()
    signer3?.close()
  })

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

  // TODO(2.0.0, testing) Optionally reorganize the nesting of this file,
  // since the quota endpoints don't depend on signer signature configuration,
  // the sig config describes can be sub-describes under the PNP_SIGN tests.
  // Part of (https://github.com/celo-org/celo-monorepo/issues/9811)
  describe('when all signers return correct signatures', () => {
    beforeEach(async () => {
      signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
          // TODO(2.0.0, refactor) investigate what change caused empty warnings to now appear
          // (not attributable to toStrictEqual alone) as part of request type audit ticket
          // (https://github.com/celo-org/celo-monorepo/issues/9804)
          warnings: [],
        })
        const unblindedSig = threshold_bls.unblind(
          Buffer.from(res.body.signature, 'base64'),
          blindedMsgResult.blindingFactor
        )

        expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedMsg)
      })

      it('Should respond with 200 on valid request with key version header', async () => {
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, app, '1')

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        // TODO(2.0.0) determine how / whether to forward this to client
        // (https://github.com/celo-org/celo-monorepo/issues/9801)
        // expect(res.get(KEY_VERSION_HEADER)).toEqual('1')
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendPnpSignRequest(req, authorization, app)
        const expectedResponse: SignMessageResponseSuccess = {
          success: true,
          version: expectedVersion,
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
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
        expect(Buffer.from(unblindedSig1).toString('base64')).toEqual(expectedUnblindedMsg)
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

      it('Should respond with 400 on invalid key version', async () => {
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, app, 'a')
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
        const appWithApiDisabled = startCombiner(configWithApiDisabled)

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
        it('Should return 200 on failure to fetch DEK', async () => {
          mockGetDataEncryptionKey.mockImplementation(() => {
            throw new Error()
          })

          req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
          // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
          const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
          const authorization = getPnpRequestAuthorization(req, differentPk)
          const res = await sendPnpSignRequest(req, authorization, app)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
            success: true,
            version: expectedVersion,
            signature: expectedSig,
            performedQueryCount: 1,
            totalQuota: expectedTotalQuota,
            blockNumber: testBlockNumber,
            warnings: [],
          })
          const unblindedSig = threshold_bls.unblind(
            Buffer.from(res.body.signature, 'base64'),
            blindedMsgResult.blindingFactor
          )
          expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedMsg)
        })
      })
    })
  })

  // For testing combiner code paths when signers do not behave as expected
  describe('when 2/3 signers return correct signatures', () => {
    beforeEach(async () => {
      const badBlsShare1 =
        '000000002e50aa714ef6b865b5de89c56969ef9f8f27b6b0a6d157c9cc01c574ac9df604'

      const badKeyProvider1: KeyProvider = new MockKeyProvider(badBlsShare1)

      signer1 = startSigner(signerConfig, signerDB1, badKeyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
    })

    describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
      let req: SignMessageRequest

      beforeEach(() => {
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
          signature: expectedSig,
          performedQueryCount: 1,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const unblindedSig = threshold_bls.unblind(
          Buffer.from(res.body.signature, 'base64'),
          blindedMsgResult.blindingFactor
        )
        expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedMsg)
      })
    })
  })

  describe('when 1/3 signers return correct signatures', () => {
    beforeEach(async () => {
      const badBlsShare1 =
        '000000002e50aa714ef6b865b5de89c56969ef9f8f27b6b0a6d157c9cc01c574ac9df604'
      const badBlsShare2 =
        '01000000b8f0ef841dcf8d7bd1da5e8025e47d729eb67f513335784183b8fa227a0b9a0b'
      const badKeyProvider1: KeyProvider = new MockKeyProvider(badBlsShare1)
      const badKeyProvider2: KeyProvider = new MockKeyProvider(badBlsShare2)

      signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, badKeyProvider1, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, badKeyProvider2, mockKit).listen(3003)
    })

    describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
      let req: SignMessageRequest

      beforeEach(() => {
        mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainPaymentsDefault)
        req = getSignRequest(blindedMsgResult)
      })

      it('Should respond with 500 even if request is valid', async () => {
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

  describe(`${CombinerEndpoint.PNP_QUOTA}`, () => {
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

    const getCombinerQuotaResponse = async (req: PnpQuotaRequest, authorization: string) => {
      const res = await request(app)
        .post(CombinerEndpoint.PNP_QUOTA)
        .set('Authorization', authorization)
        .send(req)
      return res
    }

    const totalQuota = 10
    const weiTocusd = new BigNumber(1e17)
    beforeAll(async () => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(weiTocusd.multipliedBy(totalQuota))
    })

    beforeEach(async () => {
      signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
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
        expectedWarnings: [WarningMessage.SIGNER_RESPONSE_DISCREPANCIES],
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
          blockNumber: testBlockNumber,
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
        blockNumber: testBlockNumber,
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
        blockNumber: testBlockNumber,
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
        blockNumber: testBlockNumber,
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
        blockNumber: testBlockNumber,
        warnings: [],
      })
    })

    it('Should respond with a warning when there are slight discrepancies in total quota', async () => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValueOnce(weiTocusd.multipliedBy(totalQuota + 1))
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
        blockNumber: testBlockNumber,
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
      const req = {}
      // @ts-ignore Intentionally deleting required field
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      // @ts-ignore Intentionally deleting required field
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

    it('Should respond with 502 when insufficient signer responses', async () => {
      await signerDB1?.destroy()
      await signerDB2?.destroy()
      signer1?.close()
      signer2?.close()

      const req = {
        account: ACCOUNT_ADDRESS1,
      }
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await getCombinerQuotaResponse(req, authorization)

      expect(res.status).toBe(502)
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
      const appWithApiDisabled = startCombiner(configWithApiDisabled)
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

    describe('functionality in case of errors', () => {
      it('Should respond with 200 on failure to fetch DEK', async () => {
        mockGetDataEncryptionKey.mockReset().mockImplementation(() => {
          throw new Error()
        })

        const req = {
          account: ACCOUNT_ADDRESS1,
          authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
        }

        // NOT the dek private key, so authentication would fail if getDataEncryptionKey succeeded
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        const authorization = getPnpRequestAuthorization(req, differentPk)
        const res = await getCombinerQuotaResponse(req, authorization)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<PnpQuotaResponseSuccess>({
          success: true,
          version: expectedVersion,
          performedQueryCount: 0,
          totalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })
    })
  })
})
