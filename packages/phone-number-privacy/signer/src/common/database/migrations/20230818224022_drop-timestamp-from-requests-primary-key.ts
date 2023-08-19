import { Knex } from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.dropPrimary()
    t.primary([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.blindedQuery, REQUESTS_COLUMNS.timestamp])
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.dropPrimary()
    t.primary([REQUESTS_COLUMNS.address, REQUESTS_COLUMNS.timestamp, REQUESTS_COLUMNS.blindedQuery])
  })
}
