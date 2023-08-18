import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  // This check was necessary to switch from using .ts migrations to .js migrations.
  if (!(await knex.schema.hasTable('accounts'))) {
    return knex.schema.createTable('accounts', (t) => {
      t.string(ACCOUNTS_COLUMNS.address).notNullable().primary()
      t.dateTime(ACCOUNTS_COLUMNS.createdAt).notNullable()
      t.integer(ACCOUNTS_COLUMNS.numLookups).unsigned()
    })
  }
  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('accounts')
}
