import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.dropIndex(ACCOUNTS_COLUMNS.address)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(ACCOUNTS_TABLE, (t) => {
    t.index(ACCOUNTS_COLUMNS.address)
  })
}
