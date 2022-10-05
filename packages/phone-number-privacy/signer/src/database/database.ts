import { rootLogger as logger } from '@celo/phone-number-privacy-common'
import knex from 'knex'
import Knex from 'knex/types'
import config, { DEV_MODE, SupportedDatabase } from '../config'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from './models/account'

let db: Knex | undefined

export async function initDatabase(doTestQuery = true) {
  logger().info({ config: config.db }, 'Initializing database connection')
  const { type, host, port, user, password, database, ssl, poolMaxSize } = config.db

  let connection: any
  let client: string
  if (type === SupportedDatabase.Postgres) {
    logger().info('Using Postgres')
    client = 'pg'
    connection = {
      user,
      password,
      database,
      host,
      port: port ?? 5432,
      ssl,
      pool: { max: poolMaxSize },
    }
  } else if (type === SupportedDatabase.MySql) {
    logger().info('Using MySql')
    client = 'mysql2'
    connection = {
      user,
      password,
      database,
      host,
      port: port ?? 3306,
      ssl,
      pool: { max: poolMaxSize },
    }
  } else if (type === SupportedDatabase.MsSql) {
    logger().info('Using MS SQL')
    client = 'mssql'
    connection = {
      user,
      password,
      database,
      server: host,
      port: port ?? 1433,
      pool: { max: poolMaxSize },
    }
  } else if (type === SupportedDatabase.Sqlite) {
    logger().info('Using SQLite')
    client = 'sqlite3'
    connection = ':memory:'
  } else {
    throw new Error(`Unsupported database type: ${type}`)
  }

  db = knex({
    client,
    useNullAsDefault: type === SupportedDatabase.Sqlite,
    connection,
    debug: DEV_MODE,
  })

  logger().info('Running Migrations')

  await db.migrate.latest({
    directory: './dist/migrations',
    loadExtensions: ['.js'],
  })

  if (doTestQuery) {
    await executeTestQuery(db)
  }

  logger().info('Database initialized successfully')
  return db
}

// Closes the connections to the database.
// If the database is sqlite in-memory database, the database will be destroyed.
export async function closeDatabase() {
  // NOTE: If this operation is stuck (e.g. if you tests are failing because this operation causes
  // them to time out) it is likely because a connection is being held open e.g. by a transaction.
  await db?.destroy()
  db = undefined
}

async function executeTestQuery(_db: Knex) {
  logger().info('Counting accounts')
  const result = await _db(ACCOUNTS_TABLE).count(ACCOUNTS_COLUMNS.address).first()

  if (!result) {
    throw new Error('No result from count, have migrations been run?')
  }

  const count = Object.values(result)[0]
  if (count === undefined || count === null || count === '') {
    throw new Error('No result from count, have migrations been run?')
  }

  logger().info(`Found ${count} accounts`)
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not yet initialized')
  }

  return db
}
