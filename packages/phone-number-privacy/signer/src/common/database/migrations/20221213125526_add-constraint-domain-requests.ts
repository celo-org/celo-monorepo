import { Knex } from 'knex'
import { DOMAIN_REQUESTS_COLUMNS, DOMAIN_REQUESTS_TABLE } from '../models/domain-request'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(DOMAIN_REQUESTS_TABLE, (t) => {
    t.dateTime(DOMAIN_REQUESTS_COLUMNS.timestamp).notNullable().alter()
  })
}

export async function down(_knex: Knex): Promise<void> {}
