import knex, { Knex } from 'knex'
import { CombinerConfig, DEV_MODE } from '../../config'

export function initDatabase(config: CombinerConfig): Knex {
  return knex({
    client: 'pg',
    connection: config.db,
    debug: DEV_MODE,
  })
}

export function getTransaction(db: Knex) {
  return db.transaction()
}
