import {
  DisableDomainRequest,
  disableDomainRequestEIP712,
  domainHash,
  DomainIdentifiers,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  genSessionID,
  PoprfClient,
  SequentialDelayDomain,
  SequentialDelayStage,
  SignerEndpoint,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import { defined, noBool, noNumber, noString } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import request from 'supertest'
import config, { SupportedDatabase, SupportedKeystore } from '../../src/config'
import { closeDatabase, initDatabase } from '../../src/database/database'
import { initKeyProvider } from '../../src/key-management/key-provider'
import { createServer } from '../../src/server'

// Configurations are currently handled through a global object. As a result, we need to set the
// right parameters here before the tests start.
// We will be using a Sqlite in-memory database for tests.
config.db.type = SupportedDatabase.Sqlite
config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
config.api.domains.enabled = true

// DO NOT MERGE: Add checking of values beyond the return code.

describe('domainService', () => {
  // DO NOT MERGE(victor): Should this be refactored to pass key provider, database, and config?
  // (global config makes it harder to test things, we should pass it as a parameter)
  const app = createServer(config)

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

  beforeAll(async () => {
    await initKeyProvider()
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    await initDatabase()
  })

  afterEach(async () => {
    // Close and destroy the in-memory database.
    // Note: If tests start to be too slow, this could be replaced with more complicated logic to
    // reset the database state without destroying and recreting it for each test.
    await closeDatabase()
  })

  describe(`${SignerEndpoint.DISABLE_DOMAIN}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const { status } = await request(app)
        .post(SignerEndpoint.DISABLE_DOMAIN)
        .send(await disableRequest())

      expect(status).toBe(200)
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const response1 = await request(app)
        .post(SignerEndpoint.DISABLE_DOMAIN)
        .send(await disableRequest())
      expect(response1.status).toBe(200)

      const response2 = await request(app)
        .post(SignerEndpoint.DISABLE_DOMAIN)
        .send(await disableRequest())
      expect(response2.status).toBe(200)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const req = await disableRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(req)

      expect(status).toBe(200)
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = await disableRequest()
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on unknown domain', async () => {
      // Create a requests with an invalid domain identifier.
      const unknownRequest = await disableRequest()
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      unknownRequest.domain.name = 'UnknownDomain'

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(unknownRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on bad encoding', async () => {
      const badRequest1 = await disableRequest()
      // @ts-ignore Intentionally not JSON
      badRequest1.domain = 'Freddy'

      const res1 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest1)

      expect(res1.status).toBe(400)

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest2)

      expect(res2.status).toBe(400)
    })

    it('Should respond with 401 on failed auth', async () => {
      // Create a manipulated request, which will have a bad signature.
      const badRequest = await disableRequest()
      badRequest.domain.salt = defined('badSalt')

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

      expect(status).toBe(401)
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled = { ...config }
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = createServer(configWithApiDisabled)

      const req = await disableRequest()

      const { status } = await request(appWithApiDisabled)
        .post(SignerEndpoint.DISABLE_DOMAIN)
        .send(req)

      expect(status).toBe(503)
    })
  })

  describe(`${SignerEndpoint.DOMAIN_QUOTA_STATUS}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())

      expect(status).toBe(200)
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const response1 = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())
      expect(response1.status).toBe(200)

      const response2 = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())
      expect(response2.status).toBe(200)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const req = await quotaRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(req)

      expect(status).toBe(200)
    })

    it('Should respond with 400 on missing request fields', async () => {
      const badRequest = await quotaRequest()
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version

      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(badRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on unknown domain', async () => {
      // Create a requests with an invalid domain identifier.
      const unknownRequest = await quotaRequest()
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      unknownRequest.domain.name = 'UnknownDomain'

      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(unknownRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on bad encoding', async () => {
      const badRequest1 = await quotaRequest()
      // @ts-ignore Intentionally not JSON
      badRequest1.domain = 'Freddy'

      const res1 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest1)

      expect(res1.status).toBe(400)

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DOMAIN_QUOTA_STATUS).send(badRequest2)

      expect(res2.status).toBe(400)
    })

    it('Should respond with 401 on failed auth', async () => {
      // Create a manipulated request, which will have a bad signature.
      const badRequest = await quotaRequest()
      badRequest.domain.salt = defined('badSalt')

      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(badRequest)

      expect(status).toBe(401)
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled = { ...config }
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = createServer(configWithApiDisabled)

      const req = await quotaRequest()

      const { status } = await request(appWithApiDisabled)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(req)

      expect(status).toBe(503)
    })
  })

  describe.only(`${SignerEndpoint.DOMAIN_SIGN}`, () => {
    it('Should respond with 200 on valid request', async () => {
      const [req, _] = await signatureRequest()

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

      expect(status).toBe(200)
    })

    it('Should respond with 200 on valid request with key version header', async () => {
      const [req, _] = await signatureRequest()

      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set('keyVersion', '1')
        .send(req)

      expect(status).toBe(200)
    })

    it('Should respond with 200 on repeated valid requests', async () => {
      const req1 = (await signatureRequest())[0]

      const response1 = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set('keyVersion', '1')
        .send(req1)

      expect(response1.status).toBe(200)

      // submit identical request with nonce set to 1
      const req2 = (await signatureRequest(undefined, 1))[0]
      const response2 = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set('keyVersion', '1')
        .send(req2)

      expect(response2.status).toBe(200)
    })

    it('Should respond with 200 on extra request fields', async () => {
      const [req, _] = await signatureRequest()
      // @ts-ignore Intentionally adding an extra field to the request type
      req.options.extraField = noString

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

      expect(status).toBe(200)
    })

    it('Should respond with 400 on missing request fields', async () => {
      const [badRequest, _] = await signatureRequest()
      // @ts-ignore Intentionally deleting required field
      delete badRequest.domain.version

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on unknown domain', async () => {
      // Create a requests with an invalid domain identifier.
      const [unknownRequest, _] = await signatureRequest()
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      unknownRequest.domain.name = 'UnknownDomain'

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(unknownRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 400 on bad encoding', async () => {
      const [badRequest1, _] = await signatureRequest()
      // @ts-ignore Intentionally not JSON
      badRequest1.domain = 'Freddy'

      const res1 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest1)

      expect(res1.status).toBe(400)

      const badRequest2 = ''

      const res2 = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest2)

      expect(res2.status).toBe(400)
    })

    xit('Should respond with 400 on invalid key version', async () => {
      // TODO(Alec): Implement new error for unsupported key versions
      const [badRequest, _] = await signatureRequest()

      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .set('keyVersion', 'a')
        .send(badRequest)

      expect(status).toBe(400)
    })

    it('Should respond with 401 on failed auth', async () => {
      // Create a manipulated request, which will have a bad signature.
      const [badRequest, _] = await signatureRequest()
      badRequest.domain.salt = defined('badSalt')

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(status).toBe(401)
    })

    it('Should respond with 401 on invalid nonce', async () => {
      const [badRequest, _] = await signatureRequest()
      badRequest.options.nonce = defined(1)

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(status).toBe(401)
    })

    it('Should respond with 429 on out of quota', async () => {
      const noQuotaDomain = authenticatedDomain([
        // TODO(Alec): add better spec tests for rate limiting algorithm
        { delay: 0, resetTimer: noBool, batchSize: defined(0), repetitions: defined(0) },
      ])
      const [badRequest, _] = await signatureRequest(noQuotaDomain)

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(status).toBe(429)
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

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(badRequest)

      expect(status).toBe(429)
    })

    it('Should respond with 503 on disabled api', async () => {
      const configWithApiDisabled = { ...config }
      configWithApiDisabled.api.domains.enabled = false
      const appWithApiDisabled = createServer(configWithApiDisabled)

      const [req, _] = await signatureRequest()

      const { status } = await request(appWithApiDisabled)
        .post(SignerEndpoint.DOMAIN_SIGN)
        .send(req)

      expect(status).toBe(503)
    })
  })

  /* 

  TODO: also check response content 

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
