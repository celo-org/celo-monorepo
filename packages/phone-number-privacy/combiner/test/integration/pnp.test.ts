import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  CombinerEndpoint,
  ErrorMessage,
  genSessionID,
  KEY_VERSION_HEADER,
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
import config, { CombinerConfig } from '../../src/config'
import { startCombiner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockAccounts,
  createMockOdisPayments,
  createMockWeb3,
  getPnpRequestAuthorization,
} = TestUtils.Utils
const {
  PRIVATE_KEY1,
  ACCOUNT_ADDRESS1,
  mockAccount,
  DEK_PRIVATE_KEY,
  DEK_PUBLIC_KEY,
} = TestUtils.Values

const combinerConfig: CombinerConfig = { ...config }

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
const mockContractKit = createMockContractKit(
  {
    [ContractRetrieval.getAccounts]: createMockAccounts(mockAccount, DEK_PUBLIC_KEY),
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

// Generated with 2/3 ratio
const BLS_THRESHOLD_PK_SHARE_1 =
  '000000000e7e1a2fad3b54deb2b1b32cf4c7b084842d50bbb5c6143b9d9577d16e050f03'
const BLS_THRESHOLD_PK_SHARE_2 =
  '01000000e43f10f7778e238e1ed58d5fad9363d7439d2b5a8eeda6073d68ba87c0b10011'
const BLS_THRESHOLD_PK_SHARE_3 =
  '02000000b90106bf4261e13389f867c267e86bd0015dcf9c48c784738695d0a3b3f8460c'

const BLS_THRESHOLD_PUBKEY =
  'eb569eb8701d831a0a9ffe5df325eed2ac7f5693c758c02aad5804009fcca42ece73f7f560b3e237b60a6b0f5e0d6501516b38b0f9fa20dd944c66edf798cfea73bc232983e0885b04e3632dc125b2ad63c13676723b931d5f686d2c83165d81'
const BLS_POLYNOMIAL =
  '0200000000000000eb569eb8701d831a0a9ffe5df325eed2ac7f5693c758c02aad5804009fcca42ece73f7f560b3e237b60a6b0f5e0d6501516b38b0f9fa20dd944c66edf798cfea73bc232983e0885b04e3632dc125b2ad63c13676723b931d5f686d2c83165d817aaff1f84d0b008ad218eff19db698f343168cf931ba8347640123a2f826f62b66ff084273f494d4647758e9a9f889009d573705824a0e74e1f49ed234462058e53bbb4fef370b55f78da89df070c661782a84239b8c7623d09e34b9f91f7781'

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
  const message = Buffer.from('test message', 'utf8')
  const expectedSig = 'xgFMQtcgAMHJAEX/m9B4VFopYtxqPFSw0024sWzRYvQDvnmFqhXOPdnRDfa8WCEA'
  const expectedUnblindedMsg = 'lOASnDJNbJBTMYfkbU4fMiK7FcNwSyqZo8iQSM95X8YK+/158be4S1A+jcQsCUYA'

  // In current setup, the same mocked kit is used for the combiner and signers
  const mockKit = newKit('dummyKit')

  beforeAll(async () => {
    keyProvider1 = new MockKeyProvider(BLS_THRESHOLD_PK_SHARE_1)
    keyProvider2 = new MockKeyProvider(BLS_THRESHOLD_PK_SHARE_2)
    keyProvider3 = new MockKeyProvider(BLS_THRESHOLD_PK_SHARE_3)

    // TODO(2.0.0): consider updating these directly in the combiner dev config and values
    // if these are used in the legacy tests as well
    combinerConfig.phoneNumberPrivacy.keys.pubKey = Buffer.from(
      BLS_THRESHOLD_PUBKEY,
      'hex'
    ).toString('base64')
    combinerConfig.phoneNumberPrivacy.keys.polynomial = BLS_POLYNOMIAL

    app = startCombiner(combinerConfig, mockKit)
  })

  beforeEach(async () => {
    config.phoneNumberPrivacy.enabled = true

    signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

    userSeed = new Uint8Array(32)
    for (let i = 0; i < userSeed.length - 1; i++) {
      userSeed[i] = i
    }

    blindedMsgResult = threshold_bls.blind(message, userSeed)
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
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
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
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
        })
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendPnpSignRequest(req, authorization, app)

        expect(res1.status).toBe(200)
        expect(res1.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
        })

        const res2 = await sendPnpSignRequest(req, authorization, app)
        expect(res2.status).toBe(200)
        expect(res2.body).toMatchObject<SignMessageResponseSuccess>(res1.body)
      })

      it('Should respond with 200 on extra request fields', async () => {
        // @ts-ignore Intentionally adding an extra field to the request type
        req.extraField = 'dummyString'
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
        })
      })

      it('Should respond with 200 when authenticated with DEK', async () => {
        req.authenticationMethod = AuthenticationMethod.ENCRYPTION_KEY
        const authorization = getPnpRequestAuthorization(req, DEK_PRIVATE_KEY)
        const res = await sendPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
        })
      })

      it('Should get the same unblinded signatures from the same message (different seed)', async () => {
        const authorization1 = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res1 = await sendPnpSignRequest(req, authorization1, app)

        expect(res1.status).toBe(200)
        expect(res1.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid key version', async () => {
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, app, 'a')
        expect(res.status).toBe(400)
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        req.account = mockAccount
        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, app)

        expect(res.status).toBe(401)
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled = { ...combinerConfig }
        configWithApiDisabled.phoneNumberPrivacy.enabled = false
        const appWithApiDisabled = startCombiner(configWithApiDisabled)

        const authorization = getPnpRequestAuthorization(req, PRIVATE_KEY1)
        const res = await sendPnpSignRequest(req, authorization, appWithApiDisabled)

        expect(res.status).toBe(503)
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: WarningMessage.API_UNAVAILABLE,
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
        expect(res.body).toMatchObject<SignMessageResponseSuccess>({
          success: true,
          version: expectedVersion,
          signature: expectedSig,
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
        expect(res.body).toMatchObject<SignMessageResponseFailure>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
        })
      })
    })
  })
})
