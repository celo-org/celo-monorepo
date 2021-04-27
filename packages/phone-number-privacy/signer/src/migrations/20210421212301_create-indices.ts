import * as Knex from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../database/models/account'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE))) {
    throw new Error('Unexpected error: Could not find ACCOUNTS_TABLE')
  }
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.index(ACCOUNTS_COLUMNS.address)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.dropIndex(ACCOUNTS_COLUMNS.address)
  })
}
