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

export async function setSerializable() {
  await db.raw('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;')
}
