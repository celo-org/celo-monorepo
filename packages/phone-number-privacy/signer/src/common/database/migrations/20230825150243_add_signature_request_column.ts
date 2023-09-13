import { Knex } from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.string(REQUESTS_COLUMNS.signature)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(REQUESTS_TABLE, (t) => {
    t.dropColumn(REQUESTS_COLUMNS.signature)
  })
}
