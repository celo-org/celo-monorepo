import * as Knex from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../src/database/models/account'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable(ACCOUNTS_TABLE, (t) => {
    t.string(ACCOUNTS_COLUMNS.address)
      .notNullable()
      .primary()
    t.dateTime(ACCOUNTS_COLUMNS.createdAt).notNullable()
    t.integer(ACCOUNTS_COLUMNS.numLookups).unsigned()
    t.dateTime(ACCOUNTS_COLUMNS.didMatchmaking)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(ACCOUNTS_TABLE)
}
