import { Knex } from 'knex'
import { REQUESTS_COLUMNS } from '../models/request'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.dropTable('requestsLegacy')
}

export async function down(knex: Knex): Promise<any> {
  // Note this will not restore data
  return knex.schema.createTable('requestsLegacy', (t) => {
    t.string(REQUESTS_COLUMNS.address).notNullable()
    t.dateTime(REQUESTS_COLUMNS.timestamp).notNullable()
    t.string(REQUESTS_COLUMNS.blindedQuery).notNullable()
    t.primary([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.timestamp, REQUESTS_COLUMNS.blindedQuery])
  })
}
