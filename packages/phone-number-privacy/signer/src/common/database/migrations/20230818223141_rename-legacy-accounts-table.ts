import { Knex } from 'knex'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.renameTable('accounts', 'accountsLegacy')
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.renameTable('accountsLegacy', 'accounts')
}
