import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  ErrorMessage,
  genSessionID,
  KEY_VERSION_HEADER,
  LegacySignMessageRequest,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { AttestationsStatus } from '@celo/phone-number-privacy-common/lib/test/utils'
import { IDENTIFIER } from '@celo/phone-number-privacy-common/lib/test/values'
import {
  initDatabase as initSignerDatabase,
  startSigner,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer'
import {
  DefaultKeyName,
  KeyProvider,
} from '@celo/phone-number-privacy-signer/dist/common/key-management/key-provider-base'
import { MockKeyProvider } from '@celo/phone-number-privacy-signer/dist/common/key-management/mock-key-provider'
import { SignerConfig } from '@celo/phone-number-privacy-signer/dist/config'
import BigNumber from 'bignumber.js'
import threshold_bls from 'blind-threshold-bls'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import { Server } from 'net'
import request from 'supertest'
import config, { getCombinerVersion } from '../../src/config'
import { startCombiner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockToken,
  createMockWeb3,
  getPnpRequestAuthorization,
  createMockAttestation,
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
} = TestUtils.Values

// create deep copy
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
      enabled: false,
      shouldFailOpen: true,
    },
    legacyPhoneNumberPrivacy: {
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
}

const testBlockNumber = 1000000

const mockTokenBalance = jest.fn<BigNumber, []>()
const mockGetVerifiedStatus = jest.fn<AttestationsStatus, []>()
const mockGetWalletAddress = jest.fn<string, []>()
const mockGetDataEncryptionKey = jest.fn<string, []>()

const mockContractKit = createMockContractKit(
  {
    // getWalletAddress stays constant across all old query-quota.test.ts unit tests
    [ContractRetrieval.getAccounts]: createMockAccounts(
      mockGetWalletAddress,
      mockGetDataEncryptionKey
    ),
    [ContractRetrieval.getStableToken]: createMockToken(mockTokenBalance),
    [ContractRetrieval.getGoldToken]: createMockToken(mockTokenBalance),
    [ContractRetrieval.getAttestations]: createMockAttestation(mockGetVerifiedStatus),
  },
  createMockWeb3(5, testBlockNumber)
)

// Mock newKit as opposed to the CK constructor
// Returns an object of type ContractKit that can be passed into the signers + combiner
jest.mock('@celo/contractkit', () => ({
  ...jest.requireActual('@celo/contractkit'),
  newKit: jest.fn().mockImplementation(() => mockContractKit),
}))

describe(`legacyPnpService: ${CombinerEndpoint.LEGACY_PNP_SIGN}`, () => {
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

  const message = Buffer.from('test message', 'utf8')
  const expectedQuota = 410
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

  // In current setup, the same mocked kit is used for the combiner and signers
  const mockKit = newKit('dummyKit')

  const sendLegacyPnpSignRequest = async (
    req: LegacySignMessageRequest,
    authorization: string,
    app: any,
    keyVersionHeader?: string
  ) => {
    let reqWithHeaders = request(app)
      .post(CombinerEndpoint.LEGACY_PNP_SIGN)
      .set('Authorization', authorization)

    if (keyVersionHeader) {
      reqWithHeaders = reqWithHeaders.set(KEY_VERSION_HEADER, keyVersionHeader)
    }
    return reqWithHeaders.send(req)
  }

  const getLegacySignRequest = (
    _blindedMsgResult: threshold_bls.BlindedMessage
  ): LegacySignMessageRequest => {
    return {
      account: ACCOUNT_ADDRESS1,
      blindedQueryPhoneNumber: Buffer.from(_blindedMsgResult.message).toString('base64'),
      sessionID: genSessionID(),
    }
  }

  const prepMocks = (hasQuota: boolean) => {
    const [transactionCount, isVerified, balanceToken] = hasQuota
      ? [100, true, new BigNumber(200000000000000000)]
      : [0, false, new BigNumber(0)]
    ;[
      mockContractKit.connection.getTransactionCount,
      mockGetVerifiedStatus,
      mockGetVerifiedStatus,
      mockTokenBalance,
      mockGetDataEncryptionKey,
      mockGetWalletAddress,
    ].forEach((mockFn) => mockFn.mockReset())

    mockContractKit.connection.getTransactionCount.mockReturnValue(transactionCount)
    mockGetVerifiedStatus.mockReturnValue(
      // only the isVerified value below matters
      { isVerified, completed: 1, total: 1, numAttestationsRemaining: 1 }
    )
    mockTokenBalance.mockReturnValue(balanceToken)
    mockGetDataEncryptionKey.mockReturnValue(DEK_PUBLIC_KEY)
    mockGetWalletAddress.mockReturnValue(mockAccount)
  }

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

  let req: LegacySignMessageRequest
  beforeEach(async () => {
    signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

    // this needs to be defined here to avoid errors
    userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    blindedMsgResult = threshold_bls.blind(message, userSeed)

    req = getLegacySignRequest(blindedMsgResult)
    prepMocks(true)
  })

  afterEach(async () => {
    await signerDB1?.destroy()
    await signerDB2?.destroy()
    await signerDB3?.destroy()
    signer1?.close()
    signer2?.close()
    signer3?.close()
  })

  describe('when signers are operating correctly', () => {
    beforeEach(async () => {
      signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
    })

    it('Should respond with 200 on valid request', async () => {
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
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
        const res = await sendLegacyPnpSignRequest(req, authorization, app, i.toString())

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSignatures[i - 1],
          performedQueryCount: 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const unblindedSig = threshold_bls.unblind(
          Buffer.from(res.body.signature, 'base64'),
          blindedMsgResult.blindingFactor
        )

        expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedSigs[i - 1])
      })
    }

    it('Should respond with 200 on valid request with identifier', async () => {
      // Ensure that this gets passed through the combiner to the signer
      req.hashedPhoneNumber = IDENTIFIER
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: 440, // Additional quota gets unlocked with an identifier
        blockNumber: testBlockNumber,
        warnings: [],
      })
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res1 = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res1.status).toBe(200)
      expect(res1.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
        warnings: [],
      })

      // performedQueryCount should remain the same; same request should not
      // consume any quota
      const res2 = await sendLegacyPnpSignRequest(req, authorization, app)
      expect(res2.status).toBe(200)
      expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(res1.body)
    })

    it('Should increment performedQueryCount on request from the same account with a new message', async () => {
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res1 = await sendLegacyPnpSignRequest(req, authorization, app)

      const expectedResponse: SignMessageResponseSuccess = {
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
        warnings: [],
      }

      expect(res1.status).toBe(200)
      expect(res1.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)

      // Second request for the same account but with new message
      const message2 = Buffer.from('second test message', 'utf8')
      const blindedMsg2 = threshold_bls.blind(message2, userSeed)
      const req2 = getLegacySignRequest(blindedMsg2)
      const authorization2 = getPnpRequestAuthorization(req2, PRIVATE_KEY1)

      // Expect performedQueryCount to increase
      expectedResponse.performedQueryCount++
      expectedResponse.signature =
        'PWvuSYIA249x1dx+qzgl6PKSkoulXXE/P4WHJvGmtw77pCRilEWTn3xSp+6JS9+A'
      const res2 = await sendLegacyPnpSignRequest(req2, authorization2, app)
      expect(res2.status).toBe(200)
      expect(res2.body).toStrictEqual<SignMessageResponseSuccess>(expectedResponse)
    })

    it('Should respond with 200 on extra request fields', async () => {
      // @ts-ignore Intentionally adding an extra field to the request type
      req.extraField = 'dummyString'
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
        warnings: [],
      })
    })

    it('Should respond with 200 when authenticated with DEK', async () => {
      req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
      const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
        warnings: [],
      })
    })

    it('Should get the same unblinded signatures from the same message (different seed)', async () => {
      const authorization1 = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res1 = await sendLegacyPnpSignRequest(req, authorization1, app)

      expect(res1.status).toBe(200)
      expect(res1.body).toStrictEqual<SignMessageResponseSuccess>({
        success: true,
        version: expectedVersion,
        signature: expectedSignature,
        performedQueryCount: 1,
        totalQuota: expectedQuota,
        blockNumber: testBlockNumber,
        warnings: [],
      })

      const secondUserSeed = new Uint8Array(userSeed)
      secondUserSeed[0]++
      // Ensure message is identical except for message
      const req2 = { ...req }
      const blindedMsgResult2 = threshold_bls.blind(message, secondUserSeed)
      req2.blindedQueryPhoneNumber = Buffer.from(blindedMsgResult2.message).toString('base64')

      // Sanity check
      expect(req2.blindedQueryPhoneNumber).not.toEqual(req.blindedQueryPhoneNumber)

      const authorization2 = getPnpRequestAuthorization(req2, PRIVATE_KEY1)
      const res2 = await sendLegacyPnpSignRequest(req2, authorization2, app)
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
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(400)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on unsupported key version', async () => {
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app, '4')
      expect(res.status).toBe(400)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
      })
    })

    it('Should respond with 400 on request with invalid identifier', async () => {
      // Ensure that this gets passed through the combiner to the signer
      req.hashedPhoneNumber = '+1234567890'
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(400)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 401 on failed WALLET_KEY auth', async () => {
      req.account = mockAccount
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

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
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

      expect(res.status).toBe(401)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond with 403 on out of quota', async () => {
      prepMocks(false)
      const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
      const res = await sendLegacyPnpSignRequest(req, authorization, app)

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
      const res = await sendLegacyPnpSignRequest(req, authorization, appWithApiDisabled)

      expect(res.status).toBe(503)
      expect(res.body).toStrictEqual<SignMessageResponseFailure>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })

    describe('functionality in case of errors', () => {
      it('Should respond with 200 on failure to fetch DEK when shouldFailOpen is true', async () => {
        mockGetDataEncryptionKey.mockImplementation(() => {
          throw new Error()
        })

        // Would fail authentication if getDataEncryptionKey succeeded
        const differentPk = '0x00000000000000000000000000000000000000000000000000000000ddddbbbb'
        req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
        const authorization = getPnpRequestAuthorization(req, differentPk)

        const combinerConfigWithFailOpenEnabled: typeof combinerConfig = JSON.parse(
          JSON.stringify(combinerConfig)
        )
        combinerConfigWithFailOpenEnabled.phoneNumberPrivacy.shouldFailOpen = true
        const appWithFailOpenEnabled = startCombiner(combinerConfigWithFailOpenEnabled, mockKit)
        const res = await sendLegacyPnpSignRequest(req, authorization, appWithFailOpenEnabled)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSignature,
          performedQueryCount: 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
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

  // For testing combiner code paths when signers do not behave as expected
  describe('when signers are not operating correctly', () => {
    let authorization: string

    beforeEach(() => {
      authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
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

      it('Should respond with 200 on valid request', async () => {
        const res = await sendLegacyPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSignature,
          performedQueryCount: 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
        const unblindedSig = threshold_bls.unblind(
          Buffer.from(res.body.signature, 'base64'),
          blindedMsgResult.blindingFactor
        )
        expect(Buffer.from(unblindedSig).toString('base64')).toEqual(expectedUnblindedSig)
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

      it('Should respond with 500 even if request is valid', async () => {
        const res = await sendLegacyPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
        })
      })
    })

    describe('when 2/3 of signers are disabled', () => {
      beforeEach(async () => {
        const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithApiDisabled.api.legacyPhoneNumberPrivacy.enabled = false
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
        signer2 = startSigner(configWithApiDisabled, signerDB2, keyProvider2, mockKit).listen(3002)
        signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3, mockKit).listen(3003)
      })

      it('Should fail to reach threshold of signers on valid request', async () => {
        const res = await sendLegacyPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(503) // majority error code in this case
        expect(res.body).toStrictEqual<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
        })
      })
    })

    describe('when 1/3 of signers are disabled', () => {
      beforeEach(async () => {
        const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithApiDisabled.api.legacyPhoneNumberPrivacy.enabled = false
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
        signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
        signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3, mockKit).listen(3003)
      })

      it('Should respond with 200 on valid request', async () => {
        const res = await sendLegacyPnpSignRequest(req, authorization, app)
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSignature,
          performedQueryCount: 1,
          totalQuota: expectedQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
      })
    })

    describe('when signers timeout', () => {
      beforeEach(async () => {
        const testTimeoutMS = 0

        const configWithShortTimeout: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithShortTimeout.timeout = testTimeoutMS
        // Test this with all signers timing out to decrease possibility of race conditions
        signer1 = startSigner(configWithShortTimeout, signerDB1, keyProvider1, mockKit).listen(3001)
        signer2 = startSigner(configWithShortTimeout, signerDB2, keyProvider2, mockKit).listen(3002)
        signer3 = startSigner(configWithShortTimeout, signerDB3, keyProvider3, mockKit).listen(3003)
      })
      it('Should fail to reach threshold of signers on valid request', async () => {
        const res = await sendLegacyPnpSignRequest(req, authorization, app)
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
