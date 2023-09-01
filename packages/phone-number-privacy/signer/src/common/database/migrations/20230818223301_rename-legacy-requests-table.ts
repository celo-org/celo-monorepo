import { Knex } from 'knex'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.renameTable('requests', 'requestsLegacy')
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.renameTable('requestsLegacy', 'requests')
}
