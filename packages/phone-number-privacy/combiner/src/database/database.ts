import knex, { Knex } from 'knex'
import { Config } from '..'
import { DEV_MODE } from '../config'

export function initDatabase(config: Config): Knex {
  return knex({
    client: 'pg',
    connection: config.db,
    debug: DEV_MODE,
  })
}

export function getTransaction(db: Knex) {
  return db.transaction()
}
