import { Knex } from 'knex'
import { DOMAIN_REQUESTS_COLUMNS, DOMAIN_REQUESTS_TABLE } from '../models/domain-request'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable(DOMAIN_REQUESTS_TABLE, (t) => {
    t.dropNullable(DOMAIN_REQUESTS_COLUMNS.timestamp)
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable(DOMAIN_REQUESTS_TABLE, (t) => {
    t.setNullable(DOMAIN_REQUESTS_COLUMNS.timestamp)
  })
}
