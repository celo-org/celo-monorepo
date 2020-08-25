import * as Knex from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../database/models/account'

export async function up(knex: Knex): Promise<any> {
  // This check was necessary to switch from using .ts migrations to .js migrations.
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE))) {
    return knex.schema.createTable(ACCOUNTS_TABLE, (t) => {
      t.string(ACCOUNTS_COLUMNS.address)
        .notNullable()
        .primary()
      t.dateTime(ACCOUNTS_COLUMNS.createdAt).notNullable()
      t.integer(ACCOUNTS_COLUMNS.numLookups).unsigned()
      t.dateTime(ACCOUNTS_COLUMNS.didMatchmaking)
    })
  }
  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(ACCOUNTS_TABLE)
}
