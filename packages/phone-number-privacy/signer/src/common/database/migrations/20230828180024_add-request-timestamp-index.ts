import { Knex } from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.index(REQUESTS_COLUMNS.timestamp)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.dropIndex(REQUESTS_COLUMNS.timestamp)
  })
}
