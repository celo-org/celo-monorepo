import knex from 'knex'
import config, { DEV_MODE } from '../config'

const db = knex({
  client: 'pg',
  connection: config.db,
  debug: DEV_MODE,
})

export function getDatabase() {
  return db
}
