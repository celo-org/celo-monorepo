import * as Knex from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../src/database/models/account'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE } from '../src/database/models/numberPair'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(NUMBER_PAIRS_TABLE))) {
    throw new Error('Unexpected error: Could not find NUMBER_PAIRS_TABLE')
  }
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE))) {
    throw new Error('Unexpected error: Could not find ACCOUNTS_TABLE')
  }
  await knex.schema.alterTable(NUMBER_PAIRS_TABLE, (t) => {
    t.index(NUMBER_PAIRS_COLUMN.contactPhoneHash)
  })
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.index(ACCOUNTS_COLUMNS.address)
  })
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable(NUMBER_PAIRS_TABLE, (t) => {
    t.dropIndex(NUMBER_PAIRS_COLUMN.contactPhoneHash)
  })
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.dropIndex(ACCOUNTS_COLUMNS.address)
  })
}
