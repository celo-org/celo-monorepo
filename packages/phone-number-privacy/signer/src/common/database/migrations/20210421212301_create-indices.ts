import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable('accounts'))) {
    throw new Error('Unexpected error: Could not find accounts')
  }
  return knex.schema.alterTable('accounts', (t) => {
    t.index(ACCOUNTS_COLUMNS.address)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable('accounts', (t) => {
    t.dropIndex(ACCOUNTS_COLUMNS.address)
  })
}
