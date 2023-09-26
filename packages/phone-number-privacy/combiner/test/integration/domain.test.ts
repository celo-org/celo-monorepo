import {
  CombinerEndpoint,
  DB_TIMEOUT,
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
  FULL_NODE_TIMEOUT_IN_MS,
  genSessionID,
  getContractKitWithAgent,
  KEY_VERSION_HEADER,
  PoprfClient,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
  SequentialDelayDomain,
  SequentialDelayStage,
  TestUtils,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { initDatabase as initSignerDatabase } from '@celo/phone-number-privacy-signer/dist/common/database/database'
import { startSigner } from '@celo/phone-number-privacy-signer/dist/server'
import { SupportedDatabase, SupportedKeystore } from '@celo/phone-number-privacy-signer/dist/config'
import {
  DefaultKeyName,
  KeyProvider,
} from '@celo/phone-number-privacy-signer/dist/common/key-management/key-provider-base'
import { SignerConfig } from '@celo/phone-number-privacy-signer/dist/config'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import BigNumber from 'bignumber.js'
import { Server as HttpsServer } from 'https'
import { Knex } from 'knex'
import { Server } from 'http'
import request from 'supertest'
import { MockKeyProvider } from '../../../signer/dist/common/key-management/mock-key-provider'
import config from '../../src/config'
import { startCombiner } from '../../src/server'
import { serverClose } from '../utils'

const {
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V1,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V2,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V3,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V1,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V2,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V3,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V1,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V2,
  DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V3,
} = TestUtils.Values

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
    // Equivalent to 0.001 cUSD/query
    queryPriceInCUSD: new BigNumber(0.001),
  },
  api: {
    domains: {
      enabled: true,
    },
    phoneNumberPrivacy: {
      enabled: false,
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
  requestPrunningJobCronPattern: '0 0 * * * *',
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

  const DEFAULT_PUB_KEY =
    TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEYS[config.domains.keys.currentVersion - 1]
  const signatureRequest = async (
    _domain?: SequentialDelayDomain,
    _nonce?: number,
    _pubKey: string = DEFAULT_PUB_KEY
  ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, PoprfClient]> => {
    const domain = _domain ?? authenticatedDomain()
    const poprfClient = new PoprfClient(
      Buffer.from(_pubKey, 'base64'),
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

  const signerMigrationsPath = '../signer/dist/common/database/migrations'

  describe('with n=3, t=2', () => {
    const expectedEvals: string[] = [
      '3QLFPV6VvnhhnZ7mOu0xm7BUUJIUVY6vEHvZONOtZ/c=',
      'BBG0fAZJ6VNQwjge+3vOCF3uBo5KCs2+er/f/2QcV58=',
      '1/otd1fW1nhUoU3ubjFDS8/RX0OClvHDsmGdnz6fZVE=',
    ]
    const expectedEval = expectedEvals[config.domains.keys.currentVersion - 1]

    beforeAll(async () => {
      keyProvider1 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.DOMAINS}-1`, DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V1],
          [`${DefaultKeyName.DOMAINS}-2`, DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V2],
          [`${DefaultKeyName.DOMAINS}-3`, DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V3],
        ])
      )
      keyProvider2 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.DOMAINS}-1`, DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V1],
          [`${DefaultKeyName.DOMAINS}-2`, DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V2],
          [`${DefaultKeyName.DOMAINS}-3`, DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V3],
        ])
      )
      keyProvider3 = new MockKeyProvider(
        new Map([
          [`${DefaultKeyName.DOMAINS}-1`, DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V1],
          [`${DefaultKeyName.DOMAINS}-2`, DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V2],
          [`${DefaultKeyName.DOMAINS}-3`, DOMAINS_THRESHOLD_DEV_PK_SHARE_3_V3],
        ])
      )

      app = startCombiner(combinerConfig, getContractKitWithAgent(combinerConfig.blockchain))
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
      await serverClose(signer1)
      await serverClose(signer2)
      await serverClose(signer3)
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
          const appWithApiDisabled = startCombiner(
            configWithApiDisabled,
            getContractKitWithAgent(configWithApiDisabled.blockchain)
          )
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

          const res1 = await request(app)
            .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
            .send(badRequest1)

          expect(res1.status).toBe(400)
          expect(res1.body).toStrictEqual<DomainQuotaStatusResponse>({
            success: false,
            version: res1.body.version,
            error: WarningMessage.INVALID_INPUT,
          })

          const badRequest2 = ''

          const res2 = await request(app)
            .post(CombinerEndpoint.DOMAIN_QUOTA_STATUS)
            .send(badRequest2)

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
          const appWithApiDisabled = startCombiner(
            configWithApiDisabled,
            getContractKitWithAgent(configWithApiDisabled.blockchain)
          )

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

        for (let i = 1; i <= 3; i++) {
          it(`Should respond with 200 on valid request with key version header ${i}`, async () => {
            const [req, poprfClient] = await signatureRequest(
              undefined,
              undefined,
              TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEYS[i - 1]
            )

            const res = await request(app)
              .post(CombinerEndpoint.DOMAIN_SIGN)
              .set(KEY_VERSION_HEADER, i.toString())
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
            const evaluation = poprfClient.unblindResponse(
              Buffer.from(res.body.signature, 'base64')
            )
            expect(evaluation.toString('base64')).toEqual(expectedEvals[i - 1])
          })
        }

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

        it('Should respond with 400 on unsupported key version', async () => {
          const [badRequest, _] = await signatureRequest()

          const res = await request(app)
            .post(CombinerEndpoint.DOMAIN_SIGN)
            .set(KEY_VERSION_HEADER, '4')
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
        })

        it('Should respond with 503 on disabled api', async () => {
          const configWithApiDisabled: typeof combinerConfig = JSON.parse(
            JSON.stringify(combinerConfig)
          )
          configWithApiDisabled.domains.enabled = false
          const appWithApiDisabled = startCombiner(
            configWithApiDisabled,
            getContractKitWithAgent(configWithApiDisabled.blockchain)
          )

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
      // In this case (1/3 signers are correct), response unblinding is guaranteed to fail
      // Testing 2/3 signers is flaky since the combiner sometimes combines two
      // correct signatures and returns, and sometimes combines one wrong/one correct
      // since it cannot verify the sigs server-side.
      describe('when 1/3 signers return correct signatures', () => {
        beforeEach(async () => {
          // Signer 1 & 2's v1 keys are misconfigured to point to the v3 share
          const badKeyProvider1 = new MockKeyProvider(
            new Map([[`${DefaultKeyName.DOMAINS}-1`, DOMAINS_THRESHOLD_DEV_PK_SHARE_1_V3]])
          )
          const badKeyProvider2 = new MockKeyProvider(
            new Map([[`${DefaultKeyName.DOMAINS}-1`, DOMAINS_THRESHOLD_DEV_PK_SHARE_2_V3]])
          )
          signer1 = startSigner(signerConfig, signerDB1, badKeyProvider1).listen(3001)
          signer2 = startSigner(signerConfig, signerDB2, badKeyProvider2).listen(3002)
          signer3 = startSigner(signerConfig, signerDB3, keyProvider3).listen(3003)
        })

        describe(`${CombinerEndpoint.DOMAIN_SIGN}`, () => {
          it('Should respond with 200 on valid request', async () => {
            // Ensure requested keyVersion is one that signer1 does not have
            const [req, poprfClient] = await signatureRequest(
              undefined,
              undefined,
              TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEY_V1
            )
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
            expect(() =>
              poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
            ).toThrow(/verification failed/)
          })
        })
      })

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
            const evaluation = poprfClient.unblindResponse(
              Buffer.from(res.body.signature, 'base64')
            )
            expect(evaluation.toString('base64')).toEqual(expectedEval)
          })
        })
      })

      describe('when signers timeout', () => {
        beforeEach(async () => {
          const testTimeoutMS = 0

          const configWithShortTimeout: SignerConfig = JSON.parse(JSON.stringify(signerConfig))
          configWithShortTimeout.timeout = testTimeoutMS
          // Test this with all signers timing out to decrease possibility of race conditions
          signer1 = startSigner(configWithShortTimeout, signerDB1, keyProvider1).listen(3001)
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
          }, 10000)
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
          }, 10000)
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
          }, 10000)
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
    combinerConfigLargerN.domains.odisServices.signers = JSON.stringify([
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
    const DOMAINS_PUBKEY_N5_T4 =
      'gEAedm5Gq+6s/r4ohLrduNmb7IznkYxHQ46+IW0iwEjcjWCi3lkJuItDVa3EXaoBKF4yFAa7wtuX7I8hB3m730XdEpd/77C2GOVGtwDshtCgajSzx7+0zvrnat5QmTkB'

    combinerConfigLargerN.domains.keys.versions = JSON.stringify([
      {
        keyVersion: 1,
        threshold: 4,
        polynomial:
          '040000000000000080401e766e46abeeacfebe2884baddb8d99bec8ce7918c47438ebe216d22c048dc8d60a2de5909b88b4355adc45daa01285e321406bbc2db97ec8f210779bbdf45dd12977fefb0b618e546b700ec86d0a06a34b3c7bfb4cefae76ade50993901bbf28cb0b2245e5de0926ce13338440e3b5a378dfe10ba41f61d145d9d5df29ce32abba7562804919101e4803bb47301da265654875d06a0c355b93918ff58efe29c6225d42c2b60c4efbdf7984e3b1ed4e997d53e719aa93fdc10171202460055955ad375e460a181f701a22f543365622c4a5f6ad16fce62e24584b77c23db48312840d0301197c3529cda8b712e01897a2cefab5437f658c59a2a3d880315c3268de1128b333a51d36b2999bf587d25ec82f3695db4c75f9825baf88a460002b11295e74511608041574063faa86f27251a2766861ada6a89bf45454aa4b933992f80622a810b8aead298964f37004ad57215433da765e1d3aae5d9b57ad2d9afcdf77f227e48040ac5701abce7995f94ac0c4c70996333396620e6cf8e00',
        pubKey: DOMAINS_PUBKEY_N5_T4,
      },
    ])

    beforeAll(async () => {
      keyProvider1 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.DOMAINS}-1`,
            '01000000fa9f3c7a0ed050b3b4ab9df241e3e3e2069e36c96369b2bf378d7edd66e37a0e',
          ],
        ])
      )
      keyProvider2 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.DOMAINS}-1`,
            '02000000b03e8d5203edb8b27a9c56185df0ee94e8be45f0c91e116beac68c851cc4ba10',
          ],
        ])
      )
      keyProvider3 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.DOMAINS}-1`,
            '03000000bad95bc039a5418bd57e7f5bad4bf6c19ff85e523462925e226e6ac0a6770005',
          ],
        ])
      )
      keyProvider4 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.DOMAINS}-1`,
            '040000002ffdcc94fd5322e4f3e0d7ba00b591c38f77e584b61b59dd6e62cc6cfed5fd06',
          ],
        ])
      )
      keyProvider5 = new MockKeyProvider(
        new Map([
          [
            `${DefaultKeyName.DOMAINS}-1`,
            '05000000243505a19a546f5002511f9527fe03401908cd6427991f69b2380e355fec0d0d',
          ],
        ])
      )
      app = startCombiner(
        combinerConfigLargerN,
        getContractKitWithAgent(combinerConfigLargerN.blockchain)
      )
    })

    beforeEach(async () => {
      signerDB1 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB2 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB3 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB4 = await initSignerDatabase(signerConfig, signerMigrationsPath)
      signerDB5 = await initSignerDatabase(signerConfig, signerMigrationsPath)

      signer1 = startSigner(signerConfig, signerDB1, keyProvider1).listen(3001)
      signer2 = startSigner(signerConfig, signerDB2, keyProvider2).listen(3002)
      signer3 = startSigner(signerConfig, signerDB3, keyProvider3).listen(3003)
      signer4 = startSigner(signerConfig, signerDB4, keyProvider4).listen(3004)
      signer5 = startSigner(signerConfig, signerDB5, keyProvider5).listen(3005)
    })

    afterEach(async () => {
      await signerDB1?.destroy()
      await signerDB2?.destroy()
      await signerDB3?.destroy()
      await signerDB4?.destroy()
      await signerDB5?.destroy()
      await serverClose(signer1)
      await serverClose(signer2)
      await serverClose(signer3)
      await serverClose(signer4)
      await serverClose(signer5)
    })

    it('Should respond with 200 on valid request', async () => {
      const [req, poprfClient] = await signatureRequest(undefined, undefined, DOMAINS_PUBKEY_N5_T4)
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
      poprfClient.unblindResponse(Buffer.from(res.body.signature, 'base64'))
    })

    // This previously incorrectly returned 502 instead of 429
    it('Should respond with 429 on out of quota', async () => {
      const noQuotaDomain = authenticatedDomain([
        { delay: 0, resetTimer: noBool, batchSize: defined(0), repetitions: defined(0) },
      ])
      const [badRequest, _] = await signatureRequest(noQuotaDomain, undefined, DOMAINS_PUBKEY_N5_T4)

      const res = await request(app).post(CombinerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(res.status).toBe(429)
      expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.EXCEEDED_QUOTA,
      })
    })
  })
})
