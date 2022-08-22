import { newKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  genSessionID,
  KEY_VERSION_HEADER,
  SignMessageRequest,
  SignMessageResponse,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import {
  initDatabase as initSignerDatabase,
  initKeyProvider,
  startSigner,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer'
import { KeyProvider } from '@celo/phone-number-privacy-signer/src/common/key-management/key-provider-base'
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
  createMockOdisPayments,
  createMockWeb3,
  getPnpRequestAuthorization,
} = TestUtils.Utils
const { PRIVATE_KEY1, ACCOUNT_ADDRESS1, mockAccount } = TestUtils.Values

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

// TODO EN: simplify this as much as possible
const mockOdisPaymentsTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockContractKit = createMockContractKit(
  {
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

  const signerMigrationsPath = '../signer/src/common/database/migrations'
  const expectedVersion = getVersion()

  beforeAll(async () => {
    keyProvider1 = await initKeyProvider(signerConfig)
    keyProvider2 = await initKeyProvider(signerConfig)
    keyProvider3 = await initKeyProvider(signerConfig)

    // TODO EN fix dev keys
    combinerConfig.phoneNumberPrivacy.keys.pubKey = Buffer.from(
      TestUtils.Values.PNP_DEV_ODIS_PUBLIC_KEY,
      'hex'
    ).toString('base64')
    combinerConfig.phoneNumberPrivacy.keys.polynomial = Buffer.from(
      TestUtils.Values.PNP_DEV_ODIS_POLYNOMIAL,
      'hex'
    ).toString('base64')

    app = startCombiner(combinerConfig)
  })

  beforeEach(async () => {
    config.phoneNumberPrivacy.enabled = true

    signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

    const mockKit = newKit('dummyKit')

    signer1 = startSigner(signerConfig, signerDB1, keyProvider1, mockKit).listen(3001)
    signer2 = startSigner(signerConfig, signerDB2, keyProvider2, mockKit).listen(3002)
    signer3 = startSigner(signerConfig, signerDB3, keyProvider3, mockKit).listen(3003)
  })

  afterEach(async () => {
    await signerDB1?.destroy()
    await signerDB2?.destroy()
    await signerDB3?.destroy()
    signer1?.close()
    signer2?.close()
    signer3?.close()
  })

  describe(`${CombinerEndpoint.PNP_SIGN}`, () => {
    const onChainPayments = new BigNumber(1e18)
    const expectedSig = 'uaD/zaruDHt6zakSDujYSbzOdFAPqIIUGjT5X9IxN9VNe0xGffJasZUK+HrD9joB'
    // const expectedTotalQuota = 10

    const pnpSignMessageRequest = (userSeed: Uint8Array): [SignMessageRequest, Uint8Array] => {
      // TODO EN: consider moving the message blinding, etc. into the beforeAll (+ not returning blinding factor)
      const message = Buffer.from('test message', 'utf8')
      const blindedMsgResult = threshold_bls.blind(message, userSeed)
      const blindedMsg = Buffer.from(blindedMsgResult.message).toString('base64')

      return [
        {
          account: ACCOUNT_ADDRESS1,
          blindedQueryPhoneNumber: blindedMsg,
          sessionID: genSessionID(),
        },
        blindedMsgResult.blindingFactor,
      ]
    }
    let userSeed: Uint8Array

    beforeEach(() => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(onChainPayments)
      userSeed = new Uint8Array(32)
      for (let i = 0; i < userSeed.length - 1; i++) {
        userSeed[i] = i
      }
    })

    it('Should respond with 200 on valid request', async () => {
      // TODO EN: possibly combine req, auth
      const [req, blindingFactor] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: true,
        version: expectedVersion,
        signature: expectedSig,
      })
      const unblindedSig = threshold_bls.unblind(
        Buffer.from(res.body.signature, 'base64'),
        blindingFactor
      )

      expect(Buffer.from(unblindedSig).toString('base64')).toEqual(
        'J8SakytlC1bGuQ2/0+ptB3ysv2MB4ahbtHujgHBqhmP9oSkRWR7173NNxnr+/YOA'
      )
    })

    it('Should respond with 200 on valid request with key version header', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .set(KEY_VERSION_HEADER, '1')
        .send(req)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: true,
        version: expectedVersion,
        signature: expectedSig,
      })
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res1 = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res1.status).toBe(200)
      expect(res1.body).toMatchObject<SignMessageResponse>({
        success: true,
        version: expectedVersion,
        signature: expectedSig,
      })

      const res2 = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)
      expect(res2.status).toBe(200)
      expect(res2.body).toMatchObject<SignMessageResponse>(res1.body)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      // @ts-ignore Intentionally adding an extra field to the request type
      req.extraField = 'dummyString'
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: true,
        version: expectedVersion,
        signature: expectedSig,
      })
    })

    it('Should get the same unblinded signatures from the same message (different seed)', async () => {
      const [req1, blindingFactor1] = pnpSignMessageRequest(userSeed)
      const authorization1 = getPnpRequestAuthorization(req1, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res1 = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization1)
        .send(req1)

      expect(res1.status).toBe(200)
      expect(res1.body).toMatchObject<SignMessageResponse>({
        success: true,
        version: expectedVersion,
        signature: expectedSig,
      })

      const secondUserSeed = new Uint8Array(userSeed)
      secondUserSeed[0]++
      const [req2, blindingFactor2] = pnpSignMessageRequest(secondUserSeed)

      // Sanity check
      expect(req2.blindedQueryPhoneNumber).not.toEqual(req1.blindedQueryPhoneNumber)

      const authorization2 = getPnpRequestAuthorization(req2, ACCOUNT_ADDRESS1, PRIVATE_KEY1)
      const res2 = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization2)
        .send(req2)
      expect(res2.status).toBe(200)
      const unblindedSig1 = threshold_bls.unblind(
        Buffer.from(res1.body.signature, 'base64'),
        blindingFactor1
      )
      const unblindedSig2 = threshold_bls.unblind(
        Buffer.from(res2.body.signature, 'base64'),
        blindingFactor2
      )
      expect(Buffer.from(unblindedSig1).toString('base64')).toEqual(
        'J8SakytlC1bGuQ2/0+ptB3ysv2MB4ahbtHujgHBqhmP9oSkRWR7173NNxnr+/YOA'
      )
      expect(unblindedSig1).toEqual(unblindedSig2)
    })

    it('Should respond with 400 on missing request fields', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      // @ts-ignore Intentionally deleting required field
      delete req.account
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(400)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    // TODO EN: debug what's going on here -- failing with a 502 instead of 400
    xit('Should respond with 400 on invalid key version', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .set(KEY_VERSION_HEADER, 'a')
        .send(req)

      expect(res.status).toBe(400)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
      })
    })

    it('Should respond with 401 on failed auth', async () => {
      const [req, _] = pnpSignMessageRequest(userSeed)
      req.account = mockAccount
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(401)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    // TODO EN: debug what's going on, likely the failing open error
    xit('Should respond with 429 on out of quota', async () => {
      mockOdisPaymentsTotalPaidCUSD.mockReturnValue(new BigNumber(0))

      const [req, _] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(app)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(429)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.EXCEEDED_QUOTA,
      })
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled = { ...combinerConfig }
      configWithApiDisabled.phoneNumberPrivacy.enabled = false
      const appWithApiDisabled = startCombiner(configWithApiDisabled)
      const [req, _] = pnpSignMessageRequest(userSeed)
      const authorization = getPnpRequestAuthorization(req, ACCOUNT_ADDRESS1, PRIVATE_KEY1)

      const res = await request(appWithApiDisabled)
        .post(CombinerEndpoint.PNP_SIGN)
        .set('Authorization', authorization)
        .send(req)

      expect(res.status).toBe(503)
      expect(res.body).toMatchObject<SignMessageResponse>({
        success: false,
        version: expectedVersion,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })
})
