import {
  genSessionID,
  PnpQuotaRequest,
  PnpQuotaResponseSuccess,
  SignerEndpoint,
  TestUtils,
} from '@celo/phone-number-privacy-common'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import request from 'supertest'
import { KeyProvider } from '../../dist/key-management/key-provider-base'
import { initDatabase } from '../../src/common/database/database'
import { initKeyProvider } from '../../src/common/key-management/key-provider'
import { config, SupportedDatabase, SupportedKeystore } from '../../src/config'
import { startSigner } from '../../src/server'

const {
  ContractRetrieval,
  createMockContractKit,
  createMockOdisBalance,
  createMockWeb3,
} = TestUtils.Utils

const testBlockNumber = 1000000

const mockOdisBalanceTotalPaidCUSD = jest.fn<BigNumber, []>()
const mockContractKit = createMockContractKit(
  {
    [ContractRetrieval.getOdisBalance]: createMockOdisBalance(mockOdisBalanceTotalPaidCUSD),
  },
  createMockWeb3(5, testBlockNumber)
)
jest.mock('../../src/common/web3/contracts', () => ({
  ...jest.requireActual('../../src/common/web3/contracts'),
  getContractKit: jest.fn().mockImplementation(() => mockContractKit),
}))

describe('pnp', () => {
  const testPk = '0x00000000000000000000000000000000000000000000000000000000deadbeef'

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
    mockOdisBalanceTotalPaidCUSD.mockReset()
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

  const sendPnpQuotaRequest = async (pk: string) => {
    const account = privateKeyToAddress(pk)
    const req: PnpQuotaRequest = {
      account,
      sessionID: genSessionID(),
    }
    const authorization = serializeSignature(signMessage(JSON.stringify(req), pk, account))
    return request(app).get(SignerEndpoint.PNP_QUOTA).send(req).set('Authorization', authorization)
  }

  describe(`${SignerEndpoint.PNP_QUOTA}`, () => {
    // TODO EN: case for super large (implement + test overflow logic)
    const cusdQuotaParams: [BigNumber, number][] = [
      [new BigNumber(0), 0],
      [new BigNumber(1), 0],
      [new BigNumber(1.56e18), 15],
    ]
    cusdQuotaParams.forEach(([cusdWei, expectedTotalQuota]) => {
      it(`Should get totalQuota=${expectedTotalQuota} for ${cusdWei.toString()} cUSD (wei)`, async () => {
        mockOdisBalanceTotalPaidCUSD.mockReturnValue(cusdWei)
        const res = await sendPnpQuotaRequest(testPk)
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject<PnpQuotaResponseSuccess>({
          success: true,
          version: res.body.version,
          performedQueryCount: 0,
          totalQuota: expectedTotalQuota,
          blockNumber: testBlockNumber,
          warnings: [],
        })
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
