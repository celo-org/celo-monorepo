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
  SignerEndpoint,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import { defined, noBool, noString, noNumber } from '@celo/utils/lib/sign-typed-data-utils'
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
  const app = createServer()

  const wallet = new LocalWallet()
  wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
  const walletAddress = wallet.getAccounts()[0]!

  const authenticatedDomain = (): SequentialDelayDomain => ({
    name: DomainIdentifiers.SequentialDelay,
    version: '1',
    stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
    address: defined(walletAddress),
    salt: defined('himalayanPink'),
  })

  const signatureRequest = async (): Promise<
    [DomainRestrictedSignatureRequest<SequentialDelayDomain>, PoprfClient]
  > => {
    const poprfClient = new PoprfClient(
      Buffer.from(TestUtils.Values.DOMAINS_DEV_ODIS_PUBLIC_KEY, 'base64'),
      domainHash(authenticatedDomain()),
      Buffer.from('test message', 'utf8')
    )

    const req: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.SIGN,
      domain: authenticatedDomain(),
      options: {
        signature: noString,
        nonce: defined(0),
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

  // Build an sign an example disable domain request.
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

  describe('.handleDisableDomain', () => {
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

    it('Should respond with 401 on failed auth', async () => {
      // Create a manipulated request, which will have a bad signature.
      const badRequest = await disableRequest()
      badRequest.domain.salt = defined('badSalt')

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(badRequest)

      expect(status).toBe(401)
    })

    it('Should respond with 400 on unknown domain', async () => {
      // Create a requests with an invalid domain identifier.
      const unknownRequest = await disableRequest()
      // @ts-ignore UnknownDomain is (intentionally) not a valid domain identifier.
      unknownRequest.domain.name = 'UnknownDomain'

      const { status } = await request(app).post(SignerEndpoint.DISABLE_DOMAIN).send(unknownRequest)

      expect(status).toBe(400)
    })
  })

  describe('.handleGetDomainQuotaStatus', () => {
    it('Should respond with 200 on valid request', async () => {
      const { status } = await request(app)
        .post(SignerEndpoint.DOMAIN_QUOTA_STATUS)
        .send(await quotaRequest())

      expect(status).toBe(200)
    })
  })

  describe('.handleGetDomainRestrictedSignature', () => {
    it('Should respond with 200 on valid request', async () => {
      const [req, _] = await signatureRequest()

      const { status } = await request(app).post(SignerEndpoint.DOMAIN_SIGN).send(req)

      expect(status).toBe(200)
    })
  })
})
