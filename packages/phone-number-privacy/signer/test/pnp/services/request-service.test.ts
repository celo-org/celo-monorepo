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
  _config.db.type = SupportedDatabase.Sqlite
  _config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER

  beforeEach(async () => {
    // Create a new in-memory database for each test.
    db = await initDatabase(_config)
    service = new DefaultPnpRequestService(db)
  })

  it.only('should remove requests from a specific date', async () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    await service.recordRequest('Address1', 'Blinded1', 'signature1', ctx)
    await db<PnpSignRequestRecord>(REQUESTS_TABLE).update({
      timestamp: fourDaysAgo,
    })
    await service.recordRequest('Address2', 'Blinded2', 'signature2', ctx)

    // const all = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
    //   .whereNotNull(REQUESTS_COLUMNS.address)
    //   .pluck(REQUESTS_COLUMNS.timestamp)
    // console.log(typeof all[0])

    const elements = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .count(`${REQUESTS_COLUMNS.address} as CNT`)
      .first()
    // const ble = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
    //   .select([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.timestamp])
    //   .first()
    // console.log(ble, ble?.timestamp)

    expect((elements! as any)['CNT']).toBe(2)

    await service.removeOldRequest(2, ctx)

    const elementsAfter = await db<PnpSignRequestRecord>(REQUESTS_TABLE)
      .count(`${REQUESTS_COLUMNS.address} as CNT`)
      .first()
    expect((elementsAfter! as any)['CNT']).toBe(1)
  })
})
