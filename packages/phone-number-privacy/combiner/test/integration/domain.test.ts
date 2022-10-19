import {
  CombinerEndpoint,
  DisableDomainRequest,
  disableDomainRequestEIP712,
  DisableDomainResponse,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponse,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainRestrictedSignatureResponse,
  ErrorMessage,
  genSessionID,
  KEY_VERSION_HEADER,
  PoprfClient,
  SequentialDelayDomain,
  SequentialDelayStage,
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
import { KeyProvider } from '@celo/phone-number-privacy-signer/dist/common/key-management/key-provider-base'
import { SignerConfig } from '@celo/phone-number-privacy-signer/dist/config'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import { Server } from 'net'
import request from 'supertest'
import config from '../../src/config'
import { startCombiner } from '../../src/server'

// create deep copy of config
const combinerConfig: typeof config = JSON.parse(JSON.stringify(config))
combinerConfig.domains.enabled = true

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
      enabled: true,
    },
    phoneNumberPrivacy: {
      enabled: false,
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

describe('domainService', () => {
  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]!

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

  const signatureRequest = async (
    _domain?: SequentialDelayDomain,
    _nonce?: number
  ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, PoprfClient]> => {
    const domain = _domain ?? authenticatedDomain()
    const poprfClient = new PoprfClient(
      Buffer.from(TestUtils.Values.DOMAINS_DEV_ODIS_PUBLIC_KEY, 'base64'),
      domainHash(domain),
      Buffer.from('test message', 'utf8')
    )

    const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.SIGN,
      domain: domain,
      options: {
        signature: noString,
        nonce: defined(_nonce ?? 0),
      },
      blindedMessage: poprfClient.blindedMessage.toString('base64'),
      sessionID: defined(genSessionID()),
    }
    req.options.signature = defined(
      await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req))
    )
    return [req, poprfClient]
  }

  const quotaRequest = async (): Promise<DomainQuotaStatusRequest<SequentialDelayDomain>> => {
    const req: DomainQuotaStatusRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.QUOTA,
      domain: authenticatedDomain(),
      options: {
        signature: noString,
        nonce: noNumber,
      },
      sessionID: defined(genSessionID()),
    }
    req.options.signature = defined(
      await wallet.signTypedData(walletAddress, domainQuotaStatusRequestEIP712(req))
    )
    return req
  }

  // Build and sign an example disable domain request.
  const disableRequest = async (
    _domain?: SequentialDelayDomain
  ): Promise<DisableDomainRequest<SequentialDelayDomain>> => {
    const req: DisableDomainRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.DISABLE,
      domain: _domain ?? authenticatedDomain(),
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
  let signer1: Server | HttpsServer
  let signer2: Server | HttpsServer
  let signer3: Server | HttpsServer
  let app: any

  const signerMigrationsPath = '../signer/src/common/database/migrations'

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
      signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3).listen(3003)
    })

    describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
      it('Should respond with 200 on valid request', async () => {
        const res = await request(app)
          .post(CombinerEndpoint.DISABLE_DOMAIN)
          .send(await disableRequest())
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: true,
          version: res.body.version,
          status: { disabled: true, counter: 0, timer: 0, now: res.body.status.now },
        })
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = await disableRequest()
        const res1 = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(req)
        expect(res1.status).toBe(200)
        const expectedResponse: DisableDomainResponse = {
          success: true,
          version: res1.body.version,
          status: { disabled: true, counter: 0, timer: 0, now: res1.body.status.now },
        }
        expect(res1.body).toStrictEqual<DisableDomainResponse>(expectedResponse)
        const res2 = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(req)
        expect(res2.status).toBe(200)
        expectedResponse.status.now = res2.body.status.now
        expect(res2.body).toStrictEqual<DisableDomainResponse>(expectedResponse)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = await disableRequest()
        // @ts-ignore Intentionally adding an extra field to the request type
        req.options.extraField = noString

        const res = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: true,
          version: res.body.version,
          status: { disabled: true, counter: 0, timer: 0, now: res.body.status.now },
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = await disableRequest()
        // @ts-ignore Intentionally deleting required field
        delete badRequest.domain.version

        const res = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(badRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on unknown domain', async () => {
        // Create a requests with an invalid domain identifier.
        const unknownRequest = await disableRequest()
        // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
        unknownRequest.domain.name = 'UnknownDomain'

        const res = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(unknownRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on bad encoding', async () => {
        const badRequest1 = await disableRequest()
        // @ts-ignore Intentionally not JSON
        badRequest1.domain = 'Freddy'

        const res1 = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(badRequest1)

        expect(res1.status).toBe(400)
        expect(res1.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res1.body.version,
          error: WarningMessage.INVALID_INPUT,
        })

        const badRequest2 = ''

        const res2 = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(badRequest2)

        expect(res2.status).toBe(400)
        expect(res2.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res2.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        // Create a manipulated request, which will have a bad signature.
        const badRequest = await disableRequest()
        badRequest.domain.salt = defined('badSalt')

        const res = await request(app).post(CombinerEndpoint.DISABLE_DOMAIN).send(badRequest)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof combinerConfig = JSON.parse(
          JSON.stringify(combinerConfig)
        )
        configWithApiDisabled.domains.enabled = false
        const appWithApiDisabled = startCombiner(configWithApiDisabled)

        const req = await disableRequest()

        const res = await request(appWithApiDisabled)
          .post(CombinerEndpoint.DISABLE_DOMAIN)
          .send(req)

        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })
    })

    describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
      it('Should respond with 200 on valid request', async () => {
        const res = await request(app)
          .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
          .send(await quotaRequest())
        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: true,
          version: res.body.version,
          status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
        })
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const req = await quotaRequest()
        const res1 = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(req)
        const expectedResponse: DomainQuotaStatusResponse = {
          success: true,
          version: res1.body.version,
          status: { disabled: false, counter: 0, timer: 0, now: res1.body.status.now },
        }

        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<DomainQuotaStatusResponse>(expectedResponse)

        const res2 = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(req)
        expect(res2.status).toBe(200)
        // Prevent flakiness due to slight timing inconsistencies
        expectedResponse.status.now = res2.body.status.now
        expect(res2.body).toStrictEqual<DomainQuotaStatusResponse>(expectedResponse)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const req = await quotaRequest()
        // @ts-ignore Intentionally adding an extra field to the request type
        req.options.extraField = noString

        const res = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: true,
          version: res.body.version,
          status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
        })
      })

      it('Should respond with 400 on missing request fields', async () => {
        const badRequest = await quotaRequest()
        // @ts-ignore Intentionally deleting required field
        delete badRequest.domain.version

        const res = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on unknown domain', async () => {
        // Create a requests with an invalid domain identifier.
        const unknownRequest = await quotaRequest()
        // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
        unknownRequest.domain.name = 'UnknownDomain'

        const res = await request(app)
          .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
          .send(unknownRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on bad encoding', async () => {
        const badRequest1 = await quotaRequest()
        // @ts-ignore Intentionally not JSON
        badRequest1.domain = 'Freddy'

        const res1 = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest1)

        expect(res1.status).toBe(400)
        expect(res1.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res1.body.version,
          error: WarningMessage.INVALID_INPUT,
        })

        const badRequest2 = ''

        const res2 = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest2)

        expect(res2.status).toBe(400)
        expect(res2.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res2.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        // Create a manipulated request, which will have a bad signature.
        const badRequest = await quotaRequest()
        badRequest.domain.salt = defined('badSalt')

        const res = await request(app).post(CombinerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof combinerConfig = JSON.parse(
          JSON.stringify(combinerConfig)
        )
        configWithApiDisabled.domains.enabled = false
        const appWithApiDisabled = startCombiner(configWithApiDisabled)

        const req = await quotaRequest()

        const res = await request(appWithApiDisabled)
          .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
          .send(req)

        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })
    })

    describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
      const expectedEval = '+8VmIugxAuBkdRnKRJ3udlnzCPMADNwMZRfV7Loy6Vs='

      it('Should respond with 200 on valid request', async () => {
        const [req, poprfClient] = await signatureRequest()
        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res.body.version,
          signature: res.body.signature,
          status: {
            disabled: false,
            counter: 1,
            timer: res.body.status.timer,
            now: res.body.status.now,
          },
        })
        const evaluation = poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
        expect(evaluation.toString('base64')).toEqual(expectedEval)
      })

      it('Should respond with 200 on valid request with key version header', async () => {
        const [req, poprfClient] = await signatureRequest()

        const res = await request(app)
          .post(CombinerEndpoint.DOMAIN_SIGN)
          .set(KEY_VERSION_HEADER, '1')
          .send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res.body.version,
          signature: res.body.signature,
          status: {
            disabled: false,
            counter: 1,
            timer: res.body.status.timer,
            now: res.body.status.now,
          },
        })
        const evaluation = poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
        expect(evaluation.toString('base64')).toEqual(expectedEval)
        // TODO(2.0.0) determine how / whether to forward this to client
        // (https://github.com/celo-org/celo-monorepo/issues/9801)
        // expect(res.get(KEY_VERSION_HEADER)).toEqual('1')
      })

      it('Should respond with 200 if nonce > domainState', async () => {
        const [req, poprfClient] = await signatureRequest(undefined, 2)

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res.body.version,
          signature: res.body.signature,
          status: {
            disabled: false,
            counter: 1, // counter gets incremented, not set to nonce value
            timer: res.body.status.timer,
            now: res.body.status.now,
          },
        })
        const evaluation = poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
        expect(evaluation.toString('base64')).toEqual(expectedEval)
      })

      it('Should respond with 200 on repeated valid requests', async () => {
        const [req1, poprfClient] = await signatureRequest()

        const res1 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req1)
        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res1.body.version,
          signature: res1.body.signature,
          status: {
            disabled: false,
            counter: 1,
            timer: res1.body.status.timer,
            now: res1.body.status.now,
          },
        })
        const eval1 = poprfClient.unblindResponse(Buffer.from(res1.body.signature, 'base64'))
        expect(eval1.toString('base64')).toEqual(expectedEval)

        // submit identical request with nonce set to 1
        req1.options.nonce = defined(1)
        req1.options.signature = noString
        req1.options.signature = defined(
          await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req1))
        )
        const res2 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req1)

        expect(res2.status).toBe(200)
        expect(res2.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res2.body.version,
          signature: res2.body.signature,
          status: {
            disabled: false,
            counter: 2,
            timer: res2.body.status.timer,
            now: res2.body.status.now,
          },
        })
        const eval2 = poprfClient.unblindResponse(Buffer.from(res1.body.signature, 'base64'))
        expect(eval2).toEqual(eval1)
      })

      it('Should respond with 200 on extra request fields', async () => {
        const [req, poprfClient] = await signatureRequest()
        // @ts-ignore Intentionally adding an extra field to the request type
        req.options.extraField = noString

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)

        expect(res.status).toBe(200)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res.body.version,
          signature: res.body.signature,
          status: {
            disabled: false,
            counter: 1,
            timer: res.body.status.timer,
            now: res.body.status.now,
          },
        })
        const evaluation = poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
        expect(evaluation.toString('base64')).toEqual(expectedEval)
      })

      it('Should respond with 400 on missing request fields', async () => {
        const [badRequest, _] = await signatureRequest()
        // @ts-ignore Intentionally deleting required field
        delete badRequest.domain.version

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on unknown domain', async () => {
        // Create a requests with an invalid domain identifier.
        const [unknownRequest, _] = await signatureRequest()
        // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
        unknownRequest.domain.name = 'UnknownDomain'

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(unknownRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on bad encoding', async () => {
        const [badRequest1, _] = await signatureRequest()
        // @ts-ignore Intentionally not JSON
        badRequest1.domain = 'Freddy'

        const res1 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest1)

        expect(res1.status).toBe(400)
        expect(res1.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res1.body.version,
          error: WarningMessage.INVALID_INPUT,
        })

        const badRequest2 = ''

        const res2 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest2)

        expect(res2.status).toBe(400)
        expect(res2.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res2.body.version,
          error: WarningMessage.INVALID_INPUT,
        })
      })

      it('Should respond with 400 on invalid key version', async () => {
        // TODO(2.0.0, refactor, keys): Implement new error for unsupported key versions
        // (https://github.com/celo-org/celo-monorepo/issues/9801)
        const [badRequest, _] = await signatureRequest()

        const res = await request(app)
          .post(CombinerEndpoint.DOMAIN_SIGN)
          .set(KEY_VERSION_HEADER, 'a')
          .send(badRequest)

        expect(res.status).toBe(400)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        })
      })

      it('Should respond with 401 on failed auth', async () => {
        // Create a manipulated request, which will have a bad signature.
        const [badRequest, _] = await signatureRequest()
        badRequest.domain.salt = defined('badSalt')

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest)

        expect(res.status).toBe(401)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.UNAUTHENTICATED_USER,
        })
      })

      it('Should respond with 401 on invalid nonce', async () => {
        // Request must be sent first since nonce check is >= 0
        const [req1, _] = await signatureRequest()
        const res1 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req1)

        expect(res1.status).toBe(200)
        expect(res1.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: true,
          version: res1.body.version,
          signature: res1.body.signature,
          status: {
            disabled: false,
            counter: 1,
            timer: res1.body.status.timer,
            now: res1.body.status.now,
          },
        })
        const res2 = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req1)
        expect(res2.status).toBe(401)
        expect(res2.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res2.body.version,
          error: WarningMessage.INVALID_NONCE,
        })
      })

      it('Should respond with 429 on out of quota', async () => {
        const noQuotaDomain = authenticatedDomain([
          { delay: 0, resetTimer: noBool, batchSize: defined(0), repetitions: defined(0) },
        ])
        const [badRequest, _] = await signatureRequest(noQuotaDomain)

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest)

        expect(res.status).toBe(429)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 429 on request too early', async () => {
        // This domain won't accept requests until ~10 seconds after test execution
        const noQuotaDomain = authenticatedDomain([
          {
            delay: Math.floor(Date.now() / 1000) + 10,
            resetTimer: noBool,
            batchSize: defined(2),
            repetitions: defined(1),
          },
        ])
        const [badRequest, _] = await signatureRequest(noQuotaDomain)

        const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest)

        expect(res.status).toBe(429)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 429 when requesting a signature from a disabled domain', async () => {
        const testDomain = authenticatedDomain()
        const resDisable = await request(app)
          .post(CombinerEndpoint.DISABLE_DOMAIN)
          .send(await disableRequest(testDomain))
        expect(resDisable.status).toBe(200)
        expect(resDisable.body).toStrictEqual<DisableDomainResponse>({
          success: true,
          version: resDisable.body.version,
          status: { disabled: true, counter: 0, timer: 0, now: resDisable.body.status.now },
        })

        const [req, _] = await signatureRequest(testDomain)
        const resSig = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)
        expect(resSig.status).toBe(429)
        expect(resSig.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: resSig.body.version,
          error: WarningMessage.EXCEEDED_QUOTA,
        })
      })

      it('Should respond with 503 on disabled api', async () => {
        const configWithApiDisabled: typeof combinerConfig = JSON.parse(
          JSON.stringify(combinerConfig)
        )
        configWithApiDisabled.domains.enabled = false
        const appWithApiDisabled = startCombiner(configWithApiDisabled)

        const [req, _] = await signatureRequest()

        const res = await request(appWithApiDisabled).post(CombinerEndpoint.DOMAIN_SIGN).send(req)

        expect(res.status).toBe(503)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: res.body.version,
          error: WarningMessage.API_UNAVAILABLE,
        })
      })
    })
  })

  describe('when signers are not operating correctly', () => {
    describe('when 2/3 of signers are disabled', () => {
      beforeEach(async () => {
        const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithApiDisabled.api.domains.enabled = false
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
        signer2 = startSigner(configWithApiDisabled, signerDB2, keyProvider2).listen(3002)
        signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3).listen(3003)
      })

      describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DISABLE_DOMAIN)
            .send(await disableRequest())
          expect(res.status).toBe(503) // majority error code in this case
          expect(res.body).toStrictEqual<DisableDomainResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
            .send(await quotaRequest())
          expect(res.status).toBe(503) // majority error code in this case
          expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const [req, _] = await signatureRequest()
          const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)
          expect(res.status).toBe(503) // majority error code in this case
          expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
          })
        })
      })
    })

    describe('when 1/3 of signers are disabled', () => {
      beforeEach(async () => {
        const configWithApiDisabled: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithApiDisabled.api.domains.enabled = false
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
        signer2 = startSigner(signerConfig, signerDB2, keyProvider2).listen(3002)
        signer3 = startSigner(configWithApiDisabled, signerDB3, keyProvider3).listen(3003)
      })

      describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
        it('Should respond with 200 on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DISABLE_DOMAIN)
            .send(await disableRequest())
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<DisableDomainResponse>({
            success: true,
            version: res.body.version,
            status: { disabled: true, counter: 0, timer: 0, now: res.body.status.now },
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
        it('Should respond with 200 on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
            .send(await quotaRequest())
          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
            success: true,
            version: res.body.version,
            status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
        it('Should respond with 200 on valid request', async () => {
          const expectedEval = '+8VmIugxAuBkdRnKRJ3udlnzCPMADNwMZRfV7Loy6Vs='
          const [req, poprfClient] = await signatureRequest()
          const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)

          expect(res.status).toBe(200)
          expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
            success: true,
            version: res.body.version,
            signature: res.body.signature,
            status: {
              disabled: false,
              counter: 1,
              timer: res.body.status.timer,
              now: res.body.status.now,
            },
          })
          const evaluation = poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
          expect(evaluation.toString('base64')).toEqual(expectedEval)
        })
      })
    })

    describe('when 2/3 of signers timeout', () => {
      beforeEach(async () => {
        const testTimeoutMS = 0

        const configWithShortTimeout: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
        configWithShortTimeout.timeout = testTimeoutMS
        signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
        signer2 = startSigner(configWithShortTimeout, signerDB2, keyProvider2).listen(3002)
        signer3 = startSigner(configWithShortTimeout, signerDB3, keyProvider3).listen(3003)
      })

      describe(`${CombinerEndpoint.DISABLE_DOMAIN}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DISABLE_DOMAIN)
            .send(await disableRequest())
          expect(res.status).toBe(500) // majority error code in this case
          expect(res.body).toStrictEqual<DisableDomainResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.THRESHOLD_DISABLE_DOMAIN_FAILURE,
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const res = await request(app)
            .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
            .send(await quotaRequest())
          expect(res.status).toBe(500) // majority error code in this case
          expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.THRESHOLD_DOMAIN_QUOTA_STATUS_FAILURE,
          })
        })
      })

      describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
        it('Should fail to reach threshold of signers on valid request', async () => {
          const [req, _] = await signatureRequest()
          const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(req)
          expect(res.status).toBe(500) // majority error code in this case
          expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
            success: false,
            version: res.body.version,
            error: ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES,
          })
        })
      })
    })
  })
})
