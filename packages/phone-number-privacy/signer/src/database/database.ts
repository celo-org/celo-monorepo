import knex from 'knex'
import Knex from 'knex/types'
import logger from '../common/logger'
import config, { DEV_MODE, SupportedDatabase } from '../config'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from './models/account'

let db: Knex
export async function initDatabase(doTestQuery = true) {
  logger.info('Initializing database connection')
  const { type, host, port, user, password, database, ssl } = config.db

  let dbConfig: any
  let client: string
  if (type === SupportedDatabase.Postgres) {
    logger.info('Using Postgres')
    client = 'pg'
    dbConfig = {
      user,
      password,
      database,
      host,
      port: port ?? 5432,
      ssl,
    }
  } else if (type === SupportedDatabase.MySql) {
    logger.info('Using MySql')
    client = 'mysql2'
    dbConfig = {
      user,
      password,
      database,
      host,
      port: port ?? 3306,
      ssl,
    }
  } else if (type === SupportedDatabase.MsSql) {
    logger.info('Using MS SQL')
    client = 'mssql'
    dbConfig = {
      user,
      password,
      database,
      server: host,
      port: port ?? 1433,
    }
  } else {
    throw new Error(`Unsupported database type: ${type}`)
  }

  db = knex({
    client,
    connection: dbConfig,
    debug: DEV_MODE,
  })

  if (doTestQuery) {
    await executeTestQuery(db)
  }

  logger.info('Running Migrations')

  // This deletes the old migrations from before we used the .js extension.
  // Without this step, knex thinks the migrations folder is corrupt.
  // This really only needs to be run once per signer so it can be removed
  // in future realeases.
  await db
    .table('knex_migrations')
    .delete()
    .whereIn('name', [
      '20200330212224_create-accounts-table.ts',
      '20200811163913_create_requests_table.ts',
    ])

  await db.migrate.latest({
    directory: './dist/migrations',
    loadExtensions: ['.js'],
  })

  logger.info('Database initialized successfully')
  return db
}

async function executeTestQuery(_db: Knex) {
  logger.info('Counting accounts')
  const result = await _db(ACCOUNTS_TABLE)
    .count(ACCOUNTS_COLUMNS.address)
    .first()

  if (!result) {
    throw new Error('No result from count, have migrations been run?')
  }

  const count = Object.values(result)[0]
  if (count === undefined || count === null || count === '') {
    throw new Error('No result from count, have migrations been run?')
  }

  logger.info(`Found ${count} accounts`)
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not yet initialized')
  }

  return db
}
