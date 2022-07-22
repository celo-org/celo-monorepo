import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestEIP712,
  DisableDomainResponse,
  DomainIdentifiers,
  DomainRequestTypeTag,
  genSessionID,
  SequentialDelayDomain,
  SequentialDelayStage,
} from '@celo/phone-number-privacy-common'
import {
  initDatabase as initSignerDatabase,
  initKeyProvider,
  startSigner,
  SupportedDatabase,
  SupportedKeystore,
} from '@celo/phone-number-privacy-signer'
import { SignerConfig } from '@celo/phone-number-privacy-signer/dist/config'
import { KeyProvider } from '@celo/phone-number-privacy-signer/dist/key-management/key-provider-base'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import { Server } from 'http'
import { Knex } from 'knex'
import request from 'supertest'
import config, { CombinerConfig } from '../../src/config'
import { startCombiner } from '../../src/server'

const combinerConfig: CombinerConfig = config

const signerConfig: SignerConfig = {
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
  },
  api: {
    domains: {
      enabled: true,
    },
    phoneNumberPrivacy: {
      enabled: false,
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

// DO NOT MERGE: Add checking of values beyond the return code.

describe('domainService', () => {
  // Configurations are currently handled through a global object. As a result, we need to set the
  // right parameters here before the tests start.
  // We will be using a Sqlite in-memory database for tests.
  signerConfig.db.type = SupportedDatabase.Sqlite
  signerConfig.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
  signerConfig.api.domains.enabled = true

  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]! // TODO(Alec): do we need this?

  const domainStages = (): SequentialDelayStage[] => [
    { delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) },
  ]

  const authenticatedDomain = (_stages?: SequentialDelayStage[]): SequentialDelayDomain => ({
    name: DomainIdentifiers.SequentialDelay,
    version: '1',
    stages: _stages ?? domainStages(),
    address: defined(walletAddress),
    salt: defined('himalayanPink'),
  })

  // const signatureRequest = async (
  //   _domain?: SequentialDelayDomain,
  //   _nonce?: number
  // ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, PoprfClient]> => {
  //   const domain = _domain ?? authenticatedDomain()
  //   const poprfClient = new PoprfClient(
  //     Buffer.from(TestUtils.Values.DOMAINS_DEV_ODIS_PUBLIC_KEY, 'base64'),
  //     domainHash(domain),
  //     Buffer.from('test message', 'utf8')
  //   )

  //   const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
  //     type: DomainRequestTypeTag.SIGN,
  //     domain: domain,
  //     options: {
  //       signature: noString,
  //       nonce: defined(_nonce ?? 0),
  //     },
  //     blindedMessage: poprfClient.blindedMessage.toString('base64'),
  //     sessionID: defined(genSessionID()),
  //   }
  //   req.options.signature = defined(
  //     await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req))
  //   )
  //   return [req, poprfClient]
  // }

  // const quotaRequest = async (): Promise<DomainQuotaStatusRequest<SequentialDelayDomain>> => {
  //   const req: DomainQuotaStatusRequest<SequentialDelayDomain> = {
  //     type: DomainRequestTypeTag.QUOTA,
  //     domain: authenticatedDomain(),
  //     options: {
  //       signature: noString,
  //       nonce: noNumber,
  //     },
  //     sessionID: defined(genSessionID()),
  //   }
  //   req.options.signature = defined(
  //     await wallet.signTypedData(walletAddress, domainQuotaStatusRequestEIP712(req))
  //   )
  //   return req
  // }

  // Build and sign an example disable domain request.
  const disableRequest = async (): Promise<DisableDomainRequest<SequentialDelayDomain>> => {
    const req: DisableDomainRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.DISABLE,
      domain: authenticatedDomain(),
      options: {
        signature: noString,
        nonce: noNumber,
      },
      sessionID: defined(genSessionID()),
    }
    req.options.signature = defined(
      await wallet.signTypedData(walletAddress, disableDomainRequestEIP712(req))
    )
    return req
  }

  let keyProvider1: KeyProvider
  let keyProvider2: KeyProvider
  let keyProvider3: KeyProvider
  let signerDB1: Knex
  let signerDB2: Knex
  let signerDB3: Knex
  let signer1: Server | Server
  let signer2: Server | Server
  let signer3: Server | Server
  let app: any

  const signerMigrationsPath = '../signer/src/migrations'

  beforeAll(async () => {
    keyProvider1 = await initKeyProvider(signerConfig)
    keyProvider2 = await initKeyProvider(signerConfig)
    keyProvider3 = await initKeyProvider(signerConfig)

    app = startCombiner(combinerConfig)
  })

  beforeEach(async () => {
    signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
    signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)

    signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3000)
    signer2 = startSigner(signerConfig, signerDB2, keyProvider2).listen(3001)
    signer3 = startSigner(signerConfig, signerDB3, keyProvider3).listen(3002)
  })

  afterEach(async () => {
    await signerDB1?.destroy()
    await signerDB2?.destroy()
    await signerDB3?.destroy()
    signer1?.close()
    signer2?.close()
    signer3?.close()
  })

  describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
    it('Should pass', async () => {
      expect(true)
    })

    xit('Should respond with 200 on repeated valid requests', async () => {
      const res1 = await request(app)
        .post(CombinerEndpoint.DISABLE_DOMAIN)
        .send(await disableRequest())
      expect(res1.status).toBe(200)
      expect(res1.body).toMatchObject<DisableDomainResponse>({
        success: true,
        version: res1.body.version,
      })
    })

    //     xit('Should respond with 200 on repeated valid requests', async () => {
    //       const res1 = await request(app)
    //         .post(SignerEndpoint.DISABLE_DOMAIN)
    //         .send(await disableRequest())
    //       expect(res1.status).toBe(200)
    //       expect(res1.body).toMatchObject<DisableDomainResponse>({
    //         success: true,
    //         version: res1.body.version,
    //       })

    //       console.log(res1.body)

    //       const res2 = await request(app)
    //         .post(SignerEndpoint.DISABLE_DOMAIN)
    //         .send(await disableRequest())
    //       expect(res2.status).toBe(200)
    //       expect(res2.body).toMatchObject<DisableDomainResponse>({
    //         success: true,
    //         version: res2.body.version,
    //       })

    //       console.log(res2.body)
    //     })

    //     it('Should respond with 200 on extra request fields', async () => {
    //       const req = await disableRequest()
    //       // @ts-ignore Intentionally adding an extra field to the request type
    //       req.options.extraField = noString

    //       const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DisableDomainResponse>({
    //         success: true,
    //         version: res.body.version,
    //       })
    //     })

    //     it('Should respond with 400 on missing request fields', async () => {
    //       const badRequest = await disableRequest()
    //       // @ts-ignore Intentionally deleting required field
    //       delete badRequest.domain.version

    //       const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

    //       expect(res.status).toBe(400)
    //       expect(res.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 400 on unknown domain', async () => {
    //       // Create a requests with an invalid domain identifier.
    //       const unknownRequest = await disableRequest()
    //       // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
    //       unknownRequest.domain.name = 'UnknownDomain'

    //       const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(unknownRequest)

    //       expect(res.status).toBe(400)
    //       expect(res.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 400 on bad encoding', async () => {
    //       const badRequest1 = await disableRequest()
    //       // @ts-ignore Intentionally not JSON
    //       badRequest1.domain = 'Freddy'

    //       const res1 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest1)

    //       expect(res1.status).toBe(400)
    //       expect(res1.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res1.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })

    //       const badRequest2 = ''

    //       const res2 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest2)

    //       expect(res2.status).toBe(400)
    //       expect(res2.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res2.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 401 on failed auth', async () => {
    //       // Create a manipulated request, which will have a bad signature.
    //       const badRequest = await disableRequest()
    //       badRequest.domain.salt = defined('badSalt')

    //       const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

    //       expect(res.status).toBe(401)
    //       expect(res.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.UNAUTHENTICATED_USER,
    //       })
    //     })

    //     it('Should respond with 503 on disabled api', async () => {
    //       const configWithApiDisabled = { ...config }
    //       configWithApiDisabled.api.domains.enabled = false
    //       const appWithApiDisabled = createServer(configWithApiDisabled)

    //       const req = await disableRequest()

    //       const res = await request(appWithApiDisabled).post(SignerEndpoint.DISABLE_DOMAIN).send(req)

    //       expect(res.status).toBe(503)
    //       expect(res.body).toMatchObject<DisableDomainResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.API_UNAVAILABLE,
    //       })
    //     })
    //   })

    //   describe(`${SignerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    //     it('Should respond with 200 on valid request', async () => {
    //       const res = await request(app)
    //         .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
    //         .send(await quotaRequest())

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: true,
    //         version: res.body.version,
    //         status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
    //       })
    //     })

    //     it('Should respond with 200 on repeated valid requests', async () => {
    //       const res1 = await request(app)
    //         .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
    //         .send(await quotaRequest())
    //       expect(res1.status).toBe(200)
    //       expect(res1.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: true,
    //         version: res1.body.version,
    //         status: { disabled: false, counter: 0, timer: 0, now: res1.body.status.now },
    //       })

    //       const res2 = await request(app)
    //         .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
    //         .send(await quotaRequest())
    //       expect(res2.status).toBe(200)
    //       expect(res2.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: true,
    //         version: res2.body.version,
    //         status: { disabled: false, counter: 0, timer: 0, now: res2.body.status.now },
    //       })
    //     })

    //     it('Should respond with 200 on extra request fields', async () => {
    //       const req = await quotaRequest()
    //       // @ts-ignore Intentionally adding an extra field to the request type
    //       req.options.extraField = noString

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(req)

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: true,
    //         version: res.body.version,
    //         status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
    //       })
    //     })

    //     it('Should respond with 400 on missing request fields', async () => {
    //       const badRequest = await quotaRequest()
    //       // @ts-ignore Intentionally deleting required field
    //       delete badRequest.domain.version

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

    //       expect(res.status).toBe(400)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 400 on unknown domain', async () => {
    //       // Create a requests with an invalid domain identifier.
    //       const unknownRequest = await quotaRequest()
    //       // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
    //       unknownRequest.domain.name = 'UnknownDomain'

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(unknownRequest)

    //       expect(res.status).toBe(400)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 400 on bad encoding', async () => {
    //       const badRequest1 = await quotaRequest()
    //       // @ts-ignore Intentionally not JSON
    //       badRequest1.domain = 'Freddy'

    //       const res1 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest1)

    //       expect(res1.status).toBe(400)
    //       expect(res1.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res1.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })

    //       const badRequest2 = ''

    //       const res2 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest2)

    //       expect(res2.status).toBe(400)
    //       expect(res2.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res2.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 401 on failed auth', async () => {
    //       // Create a manipulated request, which will have a bad signature.
    //       const badRequest = await quotaRequest()
    //       badRequest.domain.salt = defined('badSalt')

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

    //       expect(res.status).toBe(401)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.UNAUTHENTICATED_USER,
    //       })
    //     })

    //     it('Should respond with 503 on disabled api', async () => {
    //       const configWithApiDisabled = { ...config }
    //       configWithApiDisabled.api.domains.enabled = false
    //       const appWithApiDisabled = createServer(configWithApiDisabled)

    //       const req = await quotaRequest()

    //       const res = await request(appWithApiDisabled)
    //         .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
    //         .send(req)

    //       expect(res.status).toBe(503)
    //       expect(res.body).toMatchObject<DomainQuotaStatusResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.API_UNAVAILABLE,
    //       })
    //     })
    //   })

    //   describe(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    //     it('Should respond with 200 on valid request', async () => {
    //       const [req, _] = await signatureRequest()

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: true,
    //         version: res.body.version,
    //         signature: res.body.signature,
    //         status: {
    //           disabled: false,
    //           counter: 1,
    //           timer: res.body.status.timer,
    //           now: res.body.status.now,
    //         },
    //       })
    //     })

    //     it('Should respond with 200 on valid request with key version header', async () => {
    //       const [req, _] = await signatureRequest()

    //       const res = await request(app)
    //         .post(SignerEndpoint.DOMAIN_SIGN)
    //         .set('keyVersion', '1')
    //         .send(req)

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: true,
    //         version: res.body.version,
    //         signature: res.body.signature,
    //         status: {
    //           disabled: false,
    //           counter: 1,
    //           timer: res.body.status.timer,
    //           now: res.body.status.now,
    //         },
    //       })
    //     })

    //     xit('Should respond with 200 on repeated valid requests', async () => {
    //       const req1 = (await signatureRequest())[0]

    //       const res1 = await request(app)
    //         .post(SignerEndpoint.DOMAIN_SIGN)
    //         .set('keyVersion', '1')
    //         .send(req1)

    //       console.log(res1.body)

    //       expect(res1.status).toBe(200)
    //       expect(res1.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: true,
    //         version: res1.body.version,
    //         signature: res1.body.signature,
    //         status: {
    //           disabled: false,
    //           counter: 1,
    //           timer: res1.body.status.timer,
    //           now: res1.body.status.now,
    //         },
    //       })

    //       // submit identical request with nonce set to 1
    //       const req2 = (await signatureRequest(undefined, 1))[0]
    //       const res2 = await request(app)
    //         .post(SignerEndpoint.DOMAIN_SIGN)
    //         .set('keyVersion', '1')
    //         .send(req2)

    //       console.log(res2.body)

    //       expect(res2.status).toBe(200)
    //       expect(res2.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: true,
    //         version: res2.body.version,
    //         signature: res2.body.signature,
    //         status: {
    //           disabled: false,
    //           counter: 2,
    //           timer: res2.body.status.timer,
    //           now: res2.body.status.now,
    //         },
    //       })
    //     })

    //     it('Should respond with 200 on extra request fields', async () => {
    //       const [req, _] = await signatureRequest()
    //       // @ts-ignore Intentionally adding an extra field to the request type
    //       req.options.extraField = noString

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

    //       expect(res.status).toBe(200)
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: true,
    //         version: res.body.version,
    //         signature: res.body.signature,
    //         status: {
    //           disabled: false,
    //           counter: 1,
    //           timer: res.body.status.timer,
    //           now: res.body.status.now,
    //         },
    //       })
    //     })

    //     it('Should respond with 400 on missing request fields', async () => {
    //       const [badRequest, _] = await signatureRequest()
    //       // @ts-ignore Intentionally deleting required field
    //       delete badRequest.domain.version

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

    //       expect(res.status).toBe(400)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 400 on unknown domain', async () => {
    //       // Create a requests with an invalid domain identifier.
    //       const [unknownRequest, _] = await signatureRequest()
    //       // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
    //       unknownRequest.domain.name = 'UnknownDomain'

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(unknownRequest)

    //       expect(res.status).toBe(400)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    // g    it('Should respond with 400 on bad encoding', async () => {
    //       const [badRequest1, _] = await signatureRequest()
    //       // @ts-ignore Intentionally not JSON
    //       badRequest1.domain = 'Freddy'

    //       const res1 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest1)

    //       expect(res1.status).toBe(400)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res1.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res1.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })

    //       const badRequest2 = ''

    //       const res2 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest2)

    //       expect(res2.status).toBe(400)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res2.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res2.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     xit('Should respond with 400 on invalid key version', async () => {
    //       // TODO(Alec): Implement new error for unsupported key versions
    //       const [badRequest, _] = await signatureRequest()

    //       const res = await request(app)
    //         .post(SignerEndpoint.DOMAIN_SIGN)
    //         .set('keyVersion', 'a')
    //         .send(badRequest)

    //       expect(res.status).toBe(400)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.INVALID_INPUT,
    //       })
    //     })

    //     it('Should respond with 401 on failed auth', async () => {
    //       // Create a manipulated request, which will have a bad signature.
    //       const [badRequest, _] = await signatureRequest()
    //       badRequest.domain.salt = defined('badSalt')

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

    //       expect(res.status).toBe(401)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.UNAUTHENTICATED_USER,
    //       })
    //     })

    //     it('Should respond with 401 on invalid nonce', async () => {
    //       const [badRequest, _] = await signatureRequest()
    //       badRequest.options.nonce = defined(1)

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

    //       expect(res.status).toBe(401)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.UNAUTHENTICATED_USER, // TODO: is this right?
    //       })
    //     })

    //     it('Should respond with 429 on out of quota', async () => {
    //       const noQuotaDomain = authenticatedDomain([
    //         // TODO(Alec): add better spec tests for rate limiting algorithm
    //         { delay: 0, resetTimer: noBool, batchSize: defined(0), repetitions: defined(0) },
    //       ])
    //       const [badRequest, _] = await signatureRequest(noQuotaDomain)

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

    //       expect(res.status).toBe(429)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.EXCEEDED_QUOTA,
    //       })
    //     })

    //     it('Should respond with 429 on request too early', async () => {
    //       // This domain won't accept requests until ~10 seconds after test execution
    //       const noQuotaDomain = authenticatedDomain([
    //         {
    //           delay: Math.floor(Date.now() / 1000) + 10,
    //           resetTimer: noBool,
    //           batchSize: defined(2),
    //           repetitions: defined(1),
    //         },
    //       ])
    //       const [badRequest, _] = await signatureRequest(noQuotaDomain)

    //       const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

    //       expect(res.status).toBe(429)
    //       // @ts-ignore res.body.status is expected to be undefined // TODO(Alec): is status ever provided on failure?
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.EXCEEDED_QUOTA,
    //       })
    //     })

    //     it('Should respond with 503 on disabled api', async () => {
    //       const configWithApiDisabled = { ...config }
    //       configWithApiDisabled.api.domains.enabled = false
    //       const appWithApiDisabled = createServer(configWithApiDisabled)

    //       const [req, _] = await signatureRequest()

    //       const res = await request(appWithApiDisabled).post(SignerEndpoint.DOMAIN_SIGN).send(req)

    //       expect(res.status).toBe(503)
    //       // @ts-ignore res.body.status is expected to be undefined
    //       expect(res.body).toMatchObject<DomainRestrictedSignatureResponse>({
    //         success: false,
    //         version: res.body.version,
    //         error: WarningMessage.API_UNAVAILABLE,
    //       })
    //     })
  })

  /*

  TODO(Alec): check code coverage

  [ ] Add TODOs for all ODIS tests that remain to be written
[ ] Bad signature (combiner + signer)
[ ] Bad encoding (combiner + signer)
[ ] Undefined domain (combiner + signer)
[ ] Extra fields? -> should reject / use t.strict (combiner + signer)
[ ] Valid key versions (combiner + signer)
[ ] Invalid key versions (combiner + signer)
[ ] Out of quota (combiner + signer)
[ ] Bad nonce (combiner + signer)
[ ] Request too early for rate limiting (both)
  */
})
