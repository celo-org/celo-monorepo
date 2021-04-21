import { rootLogger as logger } from '@celo/phone-number-privacy-common'
import knex from 'knex'
import Knex from 'knex/types'
import config, { DEV_MODE } from '../config'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE } from './models/numberPair'

const db = knex({
  client: 'pg',
  connection: config.db,
  debug: DEV_MODE,
})

export async function initDatabase(doTestQuery = true) {
  logger.info('Running Migrations')

  await db.migrate.latest({
    directory: './dist/migrations',
    loadExtensions: ['.js'],
  })

  if (doTestQuery) {
    await executeTestQuery(db)
  }

  logger.info('Database initialized successfully')
}

export function getDatabase() {
  return db
}

export function getTransaction() {
  return db.transaction()
}

async function executeTestQuery(_db: Knex) {
  logger.info('Querying first row')
  const result = await _db(NUMBER_PAIRS_TABLE).select(NUMBER_PAIRS_COLUMN.userPhoneHash).limit(1)

  if (!result) {
    throw new Error('No result from count, have migrations been run?')
  }

  const userPhoneHash = Object.values(result)[0]
  if (userPhoneHash === undefined || userPhoneHash === null || userPhoneHash === '') {
    throw new Error('No result from count, have migrations been run?')
  }

  logger.info(`Found ${userPhoneHash} userPhoneHash`)
}
