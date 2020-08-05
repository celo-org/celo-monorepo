import * as Knex from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../src/database/models/request'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable(REQUESTS_TABLE, (t) => {
    t.string(REQUESTS_COLUMNS.address)
      .notNullable()
      .primary()
    t.dateTime(REQUESTS_COLUMNS.timestamp).notNullable()
    t.string(REQUESTS_COLUMNS.blindedQueryPhoneNumber)
    t.string(REQUESTS_COLUMNS.hashedPhoneNumber)
    t.index(REQUESTS_COLUMNS.timestamp)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(REQUESTS_TABLE)
}
