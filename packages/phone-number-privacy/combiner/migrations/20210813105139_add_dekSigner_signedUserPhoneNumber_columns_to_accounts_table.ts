import * as Knex from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../src/database/models/account'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE))) {
    throw new Error('Unexpected error: Could not find ACCOUNTS_TABLE')
  }
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.string(ACCOUNTS_COLUMNS.signedUserPhoneNumber)
    t.string(ACCOUNTS_COLUMNS.dekSigner)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.dropColumn(ACCOUNTS_COLUMNS.signedUserPhoneNumber)
    t.dropColumn(ACCOUNTS_COLUMNS.dekSigner)
  })
}
