import {
  PnpQuotaRequest,
  PnpQuotaResponseSuccess,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import { Knex } from 'knex'
import request from 'supertest'
import { KeyProvider } from '../../dist/key-management/key-provider-base'
import { config, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { initDatabase } from '../../src/database/database'
import { initKeyProvider } from '../../src/key-management/key-provider'
import { startSigner } from '../../src/server'

// TODO EN: revisit name?
describe('pnp', async () => {
  const testPk = '0x00000000000000000000000000000000000000000000000000000000deadbeef'
  const testAddress = privateKeyToAddress(testPk)

  let keyProvider: KeyProvider
  let app: any
  let db: Knex

  const _config = config

  beforeAll(async () => {
    _config.db.type = SupportedDatabase.Sqlite
    _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
    keyProvider = await initKeyProvider(_config)
  })

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    _config.api.phoneNumberPrivacy.enabled = true
    db = await initDatabase(_config)
    app = startSigner(_config, db, keyProvider)
  })

  afterEach(async () => {
    // Close and destroy the in-memory database.
    // Note: If tests start to be too slow, this could be replaced with more complicated logic to
    // reset the database state without destroying and recreting it for each test.

    await db?.destroy()
  })

  describe(`${SignerEndpoint.STATUS}`, () => {
    // TODO EN: just for testing that everything is configured properly!
    // Possibly check version once that is extracted/has a response type?
    it('Should provide signature and return 200 on valid request', async () => {
      const res = await request(app).get(SignerEndpoint.STATUS)
      expect(res.status).toBe(200)
    })
  })

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    it('Should return 200', async () => {
      const req: PnpQuotaRequest = {
        account: testAddress,
      }

      const authorization = serializeSignature(
        signMessage(JSON.stringify(req), testPk, testAddress)
      )

      const res = await request(app)
        .post(SignerEndpoint.PNP_QUOTA)
        .send(req)
        .set('Authorization', authorization)

      expect(res.status).toBe(200)

      // TODO EN: Possibly mock on-chain call to prevent the error message??
      expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
        success: true,
        version: res.body.version,
        performedQueryCount: 0,
        totalQuota: 0,
        blockNumber: 0,
        warnings: [],
      })
    })
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
