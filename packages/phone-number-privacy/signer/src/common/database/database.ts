import { rootLogger } from '@celo/phone-number-privacy-common'
import { Knex, knex } from 'knex'
import { DEV_MODE, SignerConfig, SupportedDatabase, VERBOSE_DB_LOGGING } from '../../config'

export async function initDatabase(config: SignerConfig, migrationsPath?: string): Promise<Knex> {
  const logger = rootLogger(config.serviceName)

  logger.info({ config: config.db }, 'Initializing database connection')
  const { type, host, port, user, password, database, ssl, poolMaxSize } = config.db

  let connection: any
  let client: string
  if (type === SupportedDatabase.Postgres) {
    logger.info('Using Postgres')
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
    logger.info('Using MySql')
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
    logger.info('Using MS SQL')
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
    logger.info('Using SQLite')
    client = 'sqlite3'
    connection = ':memory:'
  } else {
    throw new Error(`Unsupported database type: ${type}`)
  }

  const db = knex({
    client,
    useNullAsDefault: type === SupportedDatabase.Sqlite,
    connection,
    debug: DEV_MODE && VERBOSE_DB_LOGGING,
  })

  logger.info('Running Migrations')

  await db.migrate.latest({
    directory: migrationsPath ?? './dist/common/database/migrations',
    loadExtensions: ['.js'],
  })

  logger.info('Database initialized successfully')
  return db
}
