import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE_LEGACY } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE_LEGACY))) {
    throw new Error('Unexpected error: Could not find ACCOUNTS_TABLE_LEGACY')
  }
  return knex.schema.alterTable(ACCOUNTS_TABLE_LEGACY, (t) => {
    t.index(ACCOUNTS_COLUMNS.address)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable(ACCOUNTS_TABLE_LEGACY, (t) => {
    t.dropIndex(ACCOUNTS_COLUMNS.address)
  })
}
