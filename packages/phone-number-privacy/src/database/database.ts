import knex from 'knex'
import config, { DEV_MODE } from '../config'

export const connectToDatabase = () => {
  console.debug('Creating knex instance')
  return knex({
    client: 'pg',
    connection: config.db,
    debug: DEV_MODE,
  })
}

const db = connectToDatabase()

export function getDatabase() {
  return db
}

export async function setSerializable() {
  await db.raw('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;')
}
