import { Knex } from 'knex'
import { ACCOUNTS_COLUMNS, ACCOUNTS_TABLE } from '../models/account'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(ACCOUNTS_TABLE))) {
    return knex.schema.createTable(ACCOUNTS_TABLE, (t) => {
      t.string(ACCOUNTS_COLUMNS.address).notNullable().primary()
      t.dateTime(ACCOUNTS_COLUMNS.createdAt).notNullable()
      t.string(ACCOUNTS_COLUMNS.dek)
      t.dateTime(ACCOUNTS_COLUMNS.onChainDataLastUpdated)
      t.primary([ACCOUNTS_COLUMNS.address, ACCOUNTS_COLUMNS.dek])
    })
  }
  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(ACCOUNTS_TABLE)
}
