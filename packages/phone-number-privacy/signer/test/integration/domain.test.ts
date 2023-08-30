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
  ErrorMessage,
  genSessionID,
  KEY_VERSION_HEADER,
  rootLogger,
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
import { countAndThrowDBError } from '../../src/common/database/utils'
import {
  createEmptyDomainStateRecord,
  getDomainStateRecord,
} from '../../src/common/database/wrappers/domain-state'
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { KeyProvider } from '../../src/common/key-management/key-provider-base'
import { config, getSignerVersion, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

jest.setTimeout(20000)

describe('domain', () => {
  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]!

  const expectedVersion = getSignerVersion()

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
    _nonce?: number,
    keyVersion: number = config.keystore.keys.domains.latest
  ): Promise<[DomainRestrictedSignatureRequest<SequentialDelayDomain>, ThresholdPoprfClient]> => {
    const domain = _domain ?? authenticatedDomain()
    const thresholdPoprfClient = new ThresholdPoprfClient(
      Buffer.from(TestUtils.Values.DOMAINS_THRESHOLD_DEV_PUBKEYS[keyVersion - 1], 'base64'),
      Buffer.from(TestUtils.Values.DOMAINS_THRESHOLD_DEV_POLYNOMIALS[keyVersion - 1], 'hex'),
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
      // Create a request with an invalid domain identifier.
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

    describe('functionality in case of errors', () => {
      it('Should respond with 500 on DB insertDomainStateRecord failure', async () => {
        const req = await disableRequest()
        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'insertDomainStateRecord'
          )
          .mockImplementationOnce(() => {
            // Handle errors in the same way as in insertDomainStateRecord
            countAndThrowDBError(
              new Error(),
              rootLogger(_config.serviceName),
              ErrorMessage.DATABASE_INSERT_FAILURE
            )
          })
        const res = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)
        spy.mockRestore()
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.DATABASE_INSERT_FAILURE,
        })
        expect(await getDomainStateRecord(db, req.domain, rootLogger(_config.serviceName))).toBe(
          null
        )
      })

      it('Should respond with 500 on signer timeout', async () => {
        const testTimeoutMS = 0
        const delay = 200

        const configWithShortTimeout = JSON.parse(JSON.stringify(_config))
        configWithShortTimeout.timeout = testTimeoutMS
        const appWithShortTimeout = startSigner(configWithShortTimeout, db, keyProvider)

        const req = await disableRequest()
        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'getDomainStateRecord'
          )
          .mockImplementationOnce(async () => {
            await new Promise((resolve) => setTimeout(resolve, testTimeoutMS + delay))
            return null
          })

        const res = await request(appWithShortTimeout).post(SignerEndpoint.DISABLE_DOMAIN).send(req)
        spy.mockRestore()

        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DisableDomainResponse>({
          success: false,
          error: ErrorMessage.TIMEOUT_FROM_SIGNER,
          version: expectedVersion,
        })
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
      // Create a request with an invalid domain identifier.
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

    describe('functionality in case of errors', () => {
      it('Should respond with 500 on DB getDomainStateRecordOrEmpty failure', async () => {
        const req = await quotaRequest()
        // Mocking getDomainStateRecord directly but requiring the real version of
        // getDomainStateRecordOrEmpty does not easily work,
        // which is why we mock the outer call here & use the countAndThrowDBError
        // helper to get as close as possible to testing a real error.
        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'getDomainStateRecordOrEmpty'
          )
          .mockImplementationOnce(() => {
            countAndThrowDBError(
              new Error(),
              rootLogger(_config.serviceName),
              ErrorMessage.DATABASE_GET_FAILURE
            )
          })
        const res = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(req)
        spy.mockRestore()
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.DATABASE_GET_FAILURE,
        })
        expect(await getDomainStateRecord(db, req.domain, rootLogger(_config.serviceName))).toBe(
          null
        )
      })
    })

    it('Should respond with 500 on signer timeout', async () => {
      const testTimeoutMS = 0
      const delay = 200

      const configWithShortTimeout = JSON.parse(JSON.stringify(_config))
      configWithShortTimeout.timeout = testTimeoutMS
      const appWithShortTimeout = startSigner(configWithShortTimeout, db, keyProvider)

      const req = await quotaRequest()
      const spy = jest
        .spyOn(
          jest.requireActual('../../src/common/database/wrappers/domain-state'),
          'getDomainStateRecordOrEmpty'
        )
        .mockImplementationOnce(async () => {
          await new Promise((resolve) => setTimeout(resolve, testTimeoutMS + delay))
          return createEmptyDomainStateRecord(req.domain)
        })

      const res = await request(appWithShortTimeout)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(req)

      spy.mockRestore()

      expect(res.status).toBe(500)
      expect(res.body).toStrictEqual<DomainQuotaStatusResponse>({
        success: false,
        error: ErrorMessage.TIMEOUT_FROM_SIGNER,
        version: expectedVersion,
      })
      // Allow time for non-killed processes to finish
      await new Promise((resolve) => setTimeout(resolve, delay))
    })
  })

  describe(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    const expectedEvals: string[] = [
      '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',
    ]
    const expectedEval = expectedEvals[_config.keystore.keys.domains.latest - 1]

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

    for (let i = 1; i <= 3; i++) {
      it(`Should respond with 200 on valid request with key version header ${i}`, async () => {
        const [req, thresholdPoprfClient] = await signatureRequest(undefined, undefined, i)

        const res = await request(app)
          .post(SignerEndpoint.DOMAIN_SIGN)
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
        const evaluation = thresholdPoprfClient.unblindPartialResponse(
          Buffer.from(res.body.signature, 'base64')
        )
        expect(evaluation.toString('base64')).toEqual(expectedEvals[i - 1])
        expect(res.get(KEY_VERSION_HEADER)).toEqual(i.toString())
      })
    }

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
      // Create a request with an invalid domain identifier.
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
        status: {
          disabled: false,
          counter: 1,
          timer: res1.body.status.timer, // Timer should be same as from first request
          now: res2.body.status.now,
        },
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
        status: {
          disabled: false,
          counter: 0,
          timer: 0,
          now: res.body.status.now,
        },
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
        status: {
          disabled: false,
          counter: 0,
          timer: 0,
          now: res.body.status.now,
        },
      })
    })

    it('Should respond with 500 on unsupported key version', async () => {
      const [req, _] = await signatureRequest(undefined, undefined, 4)

      const res = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set(KEY_VERSION_HEADER, '4')
        .send(req)

      expect(res.status).toBe(500)
      expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
        success: false,
        version: res.body.version,
        // error: WarningMessage.INVALID_KEY_VERSION_REQUEST,
        error: ErrorMessage.UNKNOWN_ERROR, // TODO make this more informative when we refactor the sign handler
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

    describe('functionality in case of errors', () => {
      it('Should respond with 500 on DB getDomainStateRecord query failure', async () => {
        const [req, _] = await signatureRequest()
        // Mocking getDomainStateRecord directly but requiring the real version of
        // getDomainStateRecordOrEmpty does not easily work,
        // which is why we mock the outer call here & use the countAndThrowDBError
        // helper to get as close as possible to testing a real error.
        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'getDomainStateRecordOrEmpty'
          )
          .mockImplementationOnce(() => {
            countAndThrowDBError(
              new Error(),
              rootLogger(_config.serviceName),
              ErrorMessage.DATABASE_GET_FAILURE
            )
          })
        const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)
        spy.mockRestore()
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.DATABASE_GET_FAILURE,
        })
        expect(await getDomainStateRecord(db, req.domain, rootLogger(_config.serviceName))).toBe(
          null
        )
      })

      it('Should respond with 500 on DB updateDomainStateRecord failure', async () => {
        const [req, _] = await signatureRequest()
        // Same as above (re: getDomainStateRecord, but with insertDomainStateRecord)
        // which is why we mock the outer call here & use the countAndThrowDBError
        // helper to get as close as possible to testing a real error.
        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'updateDomainStateRecord'
          )
          .mockImplementationOnce(() => {
            countAndThrowDBError(
              new Error(),
              rootLogger(_config.serviceName),
              ErrorMessage.DATABASE_UPDATE_FAILURE
            )
          })
        const res = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)
        spy.mockRestore()
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          version: expectedVersion,
          error: ErrorMessage.DATABASE_UPDATE_FAILURE,
        })
        expect(await getDomainStateRecord(db, req.domain, rootLogger(_config.serviceName))).toBe(
          null
        )
      })

      it('Should respond with 500 on signer timeout', async () => {
        const [req, _] = await signatureRequest()
        const testTimeoutMS = 0
        const delay = 200

        const spy = jest
          .spyOn(
            jest.requireActual('../../src/common/database/wrappers/domain-state'),
            'getDomainStateRecordOrEmpty'
          )
          .mockImplementationOnce(async () => {
            await new Promise((resolve) => setTimeout(resolve, testTimeoutMS + delay))
            return createEmptyDomainStateRecord(req.domain)
          })

        const configWithShortTimeout = JSON.parse(JSON.stringify(_config))
        configWithShortTimeout.timeout = testTimeoutMS
        const appWithShortTimeout = startSigner(configWithShortTimeout, db, keyProvider)

        const res = await request(appWithShortTimeout).post(SignerEndpoint.DOMAIN_SIGN).send(req)
        expect(res.status).toBe(500)
        expect(res.body).toStrictEqual<DomainRestrictedSignatureResponse>({
          success: false,
          error: ErrorMessage.TIMEOUT_FROM_SIGNER,
          version: expectedVersion,
        })
        spy.mockRestore()
      })
    })
  })
})
