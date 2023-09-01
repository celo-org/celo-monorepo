import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.dropTable('accountsLegacy')
}

export async function down(knex: Knex): Promise<any> {
  // Note this will not restore data
  return knex.schema.createTable('accountsLegacy', (t) => {
    t.string(ACCOUNTS_COLUMNS.address).notNullable().primary()
    t.dateTime(ACCOUNTS_COLUMNS.createdAt).notNullable()
    t.integer(ACCOUNTS_COLUMNS.numLookups).unsigned()
  })
}
