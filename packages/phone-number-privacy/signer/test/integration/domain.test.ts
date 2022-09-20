import {
  DisableDomainRequest,
  disableDomainRequestEIP712,
  DisableDomainResponse,
  DisableDomainResponseSuccess,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainQuotaStatusResponse,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainRestrictedSignatureResponse,
  genSessionID,
  KEY_VERSION_HEADER,
  SequentialDelayDomain,
  SequentialDelayStage,
  SignerEndpoint,
  TestUtils,
  ThresholdPoprfClient,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import { Knex } from 'knex'
import request from 'supertest'
import { initDatabase } from '../../src/common/database/database'
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { KeyProvider } from '../../src/common/key-management/key-provider-base'
import { config, getVersion, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

describe('domain', () => {
  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]!

  const expectedVersion = getVersion()

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
  ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, ThresholdPoprfClient]> => {
    const domain = _domain ?? authenticatedDomain()
    const thresholdPoprfClient = new ThresholdPoprfClient(
      Buffer.from(TestUtils.Values.DOMAINS_DEV_ODIS_PUBLIC_KEY, 'hex'),
      Buffer.from(TestUtils.Values.DOMAINS_DEV_ODIS_POLYNOMIAL, 'hex'),
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
      blindedMessage: thresholdPoprfClient.blindedMessage.toString('base64'),
      sessionID: defined(genSessionID()),
    }
    req.options.signature = defined(
      await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req))
    )
    return [req, thresholdPoprfClient]
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

  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  // create deep copy
  const _config: typeof config = JSON.parse(JSON.stringify(config))
  _config.db.type = SupportedDatabase.Sqlite
  _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
  _config.api.domains.enabled = true

  beforeAll(async () => {
    keyProvider = await initKeyProvider(_config)
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    db = await initDatabase(_config)
    app = startSigner(_config, db, keyProvider)
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

  describe(`${SignerEndpoint.DISABLE_DOMAIN}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const res = await request(app)
        .post(SignerEndpoint.DISABLE_DOMAIN)
        .send(await disableRequest())

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<DisableDomainResponseSuccess>({
        success: true,
        version: res.body.version,
        status: {
          disabled: true,
          counter: 0,
          timer: 0,
          now: res.body.status.now,
        },
      })
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const req = await disableRequest()
      const res1 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)
      expect(res1.status).toBe(200)
      const expectedResponse: DisableDomainResponseSuccess = {
        success: true,
        version: res1.body.version,
        status: {
          disabled: true,
          counter: 0,
          timer: 0,
          now: res1.body.status.now,
        },
      }
      expect(res1.body).toStrictEqual<DisableDomainResponseSuccess>(expectedResponse)
      const res2 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)
      expect(res2.status).toBe(200)
      // Avoid flakiness due to mismatching times between res1 & res2
      expectedResponse.status.now = res2.body.status.now
      expect(res2.body).toStrictEqual<DisableDomainResponseSuccess>(expectedResponse)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const req = await disableRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<DisableDomainResponse>({
        success: true,
        version: res.body.version,
        status: {
          disabled: true,
          counter: 0,
          timer: 0,
          now: res.body.status.now,
        },
      })
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = await disableRequest()
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version

      const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

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

      const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(unknownRequest)

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

      const res1 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest1)

      expect(res1.status).toBe(400)
      expect(res1.body).toStrictEqual<DisableDomainResponse>({
        success: false,
        version: res1.body.version,
        error: WarningMessage.INVALID_INPUT,
      })

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest2)

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

      const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

      expect(res.status).toBe(401)
      expect(res.body).toStrictEqual<DisableDomainResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

      const req = await disableRequest()

      const res = await request(appWithApiDisabled).post(SignerEndpoint.DISABLE_DOMAIN).send(req)

      expect(res.status).toBe(503)
      expect(res.body).toStrictEqual<DisableDomainResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })

  describe(`${SignerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const res = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())

      expect(res.status).toBe(200)
      expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: true,
        version: res.body.version,
        status: { disabled: false, counter: 0, timer: 0, now: res.body.status.now },
      })
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const res1 = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())
      expect(res1.status).toBe(200)
      expect(res1.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: true,
        version: res1.body.version,
        status: { disabled: false, counter: 0, timer: 0, now: res1.body.status.now },
      })

      const res2 = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())
      expect(res2.status).toBe(200)
      expect(res2.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: true,
        version: res2.body.version,
        status: { disabled: false, counter: 0, timer: 0, now: res2.body.status.now },
      })
    })

    it('Should respond with 200 on extra request fields', async () => {
      const req = await quotaRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(req)

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

      const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

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

      const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(unknownRequest)

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

      const res1 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest1)

      expect(res1.status).toBe(400)
      expect(res1.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: false,
        version: res1.body.version,
        error: WarningMessage.INVALID_INPUT,
      })

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest2)

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

      const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest)

      expect(res.status).toBe(401)
      expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

      const req = await quotaRequest()

      const res = await request(appWithApiDisabled)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(req)

      expect(res.status).toBe(503)
      expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })

  describe(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    const expectedEval =
      'AQAAADOLyMxriQz1lPksXKDan0zfWippSmq3a1st9Hk+k7ad/wKZQHgaoHtCkJucKgdeAe/BCnXDGeArwmXrdLp8ArM41S2b148ebYEhOL6nqI6HGJ7xO15sCk+eZEf/RSfdAJJDj99oz65j7fgUPJQlHl74Bf+zk78xhlFFzAliHhGxe1a4uWKaa541WqY4OqQHAPnnu9X+DKcjR9/u+gH0VWLnZi/kB3gthhB6sYcGnslkTQbSIHcTbDyNs5GN8wjzAPL2/fD/2yqZfmfupeB8dQ1/PlCJJzwS/oKfeZqh9Z61zwELfkfHVAL8lGvWEjtXANbcUZ+2KoT+XVDJc+CxpPaaGavshKQFgiVLO4cxY5g8auai4P+SkolQVUjEYjYnAKr5ZzN0l53OpqfzJy5fRlLYN+Ks+VLy+2bUxS4gUD0iLMgM1ZbdD19tXnWDSycEAEJNZPxLivV5jHB/gsq19saWdVnhGDOs4hieyUrRF0kEHTkmTbgZAsnwGcEjXtGSALQU218BFPRW79gRMC9TUCzPc970GcLqMiKMugadALpgD360KoIy/xBwai1JEScAAMWAOBxn1CcRmqWBi7bdcTcGZfPdS281G+Ua1y0q7yenU3UFk+9MW/efZVbEqtQTANYW08+nOBf8KRuXEz9BCO9F8+0Kpxwk9DQ4K5O6J/1+4uQlODjyXafvEgG9eAUaACT876ljZDQm72i3TWYacJyVSneK5L+9q81qd9krXDr1sO+4wCs0RuOKzWB1PDXzAA=='

    it('Should respond with 200 on valid request', async () => {
      const [req, thresholdPoprfClient] = await signatureRequest()

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

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
      const evaluation = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res.body.signature, 'base64')
      )
      expect(evaluation.toString('base64')).toEqual(expectedEval)
      expect(res.get(KEY_VERSION_HEADER)).toEqual(_config.keystore.keys.domains.latest.toString())
    })

    it('Should respond with 200 on valid request with key version header', async () => {
      const [req, thresholdPoprfClient] = await signatureRequest()

      const res = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set(KEY_VERSION_HEADER, '3') // since default is '1' or '2'
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
      const evaluation = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res.body.signature, 'base64')
      )
      expect(evaluation.toString('base64')).toEqual(expectedEval)
      expect(res.get(KEY_VERSION_HEADER)).toEqual('3')
    })

    it('Should respond with 200 on repeated valid requests with nonce updated', async () => {
      const [req, thresholdPoprfClient] = await signatureRequest()

      const res1 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

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
      const eval1 = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res1.body.signature, 'base64')
      )
      expect(eval1.toString('base64')).toEqual(expectedEval)

      // submit identical request with nonce set to 1
      req.options.nonce = defined(1)
      // This is how
      req.options.signature = noString
      req.options.signature = defined(
        await wallet.signTypedData(walletAddress, domainRestrictedSignatureRequestEIP712(req))
      )
      const res2 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)
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
      const eval2 = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res2.body.signature, 'base64')
      )
      expect(eval2).toEqual(eval1)
    })

    it('Should respond with 200 if nonce > domainState', async () => {
      const [req, thresholdPoprfClient] = await signatureRequest(undefined, 2)
      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)
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
      const evaluation = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res.body.signature, 'base64')
      )
      expect(evaluation.toString('base64')).toEqual(expectedEval)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const [req, thresholdPoprfClient] = await signatureRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

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
      const evaluation = thresholdPoprfClient.unblindPartialResponse(
        Buffer.from(res.body.signature, 'base64')
      )
      expect(evaluation.toString('base64')).toEqual(expectedEval)
    })

    it('Should respond with 400 on missing request fields', async () => {
      const [badRequest, _] = await signatureRequest()
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

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

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(unknownRequest)

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

      const res1 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest1)

      expect(res1.status).toBe(400)
      expect(res1.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res1.body.version,
        error: WarningMessage.INVALID_INPUT,
      })

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest2)

      expect(res2.status).toBe(400)
      expect(res2.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res2.body.version,
        error: WarningMessage.INVALID_INPUT,
      })
    })

    it('Should respond with 400 on invalid key version', async () => {
      const [badRequest, _] = await signatureRequest()

      const res = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
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

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(res.status).toBe(401)
      expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.UNAUTHENTICATED_USER,
      })
    })

    it('Should respond 401 on invalid nonce', async () => {
      // Request must be sent first since nonce check is >= 0
      const [req1, _] = await signatureRequest()
      const res1 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req1)
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
      const res2 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req1)
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

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

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

      const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(res.status).toBe(429)
      expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.EXCEEDED_QUOTA,
      })
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled: typeof _config = JSON.parse(JSON.stringify(_config))
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = startSigner(configWithApiDisabled, db, keyProvider)

      const [req, _] = await signatureRequest()

      const res = await request(appWithApiDisabled).post(SignerEndpoint.DOMAIN_SIGN).send(req)

      expect(res.status).toBe(503)
      expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res.body.version,
        error: WarningMessage.API_UNAVAILABLE,
      })
    })
  })
})
