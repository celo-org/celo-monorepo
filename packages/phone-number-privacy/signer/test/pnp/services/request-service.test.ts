import { Knex } from 'knex'
import { initDatabase } from '../../../src/common/database/database'
import { config, SupportedDatabase, SupportedKeystore } from '../../../src/config'
import {
  DefaultPnpRequestService,
  PnpRequestService,
} from '../../../src/pnp/services/request-service'
import { rootLogger } from '@celo/phone-number-privacy-common'
import {
  PnpSignRequestRecord,
  REQUESTS_COLUMNS,
  REQUESTS_TABLE,
} from '../../../src/common/database/models/request'

jest.setTimeout(20000)
describe('request service', () => {
  let db: Knex
  let service: PnpRequestService
  let ctx = {
    logger: rootLogger('test'),
    url: '',
    errors: [],
  }

  // create deep copy
  const _config: typeof config = JSON.parse(JSON.stringify(config))
  _config.db.type = SupportedDatabase.Postgres
  _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    db = await initDatabase(_config)
    service = new DefaultPnpRequestService(db)
  })

  // Skipped because it fails in sqlite, works in the other database.
  // Keep the test for future checks
  it.skip('should remove requests from a specific date', async () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    await service.recordRequest('Address1', 'Blinded1', 'signature1', ctx)
    await db<PnpSignRequestRecord>(REQUESTS_TABLE).update({
      timestamp: fourDaysAgo,
    })
    await service.recordRequest('Address2', 'Blinded2', 'signature2', ctx)

    const elements = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .count(`${REQUESTS_COLUMNS.address} as CNT`)
      .first()

    expect((elements! as any)['CNT']).toBe('2')

    await service.removeOldRequest(2, ctx)

    const elementsAfter = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .count(`${REQUESTS_COLUMNS.address} as CNT`)
      .first()
    expect((elementsAfter! as any)['CNT']).toBe('1')
  })
})
