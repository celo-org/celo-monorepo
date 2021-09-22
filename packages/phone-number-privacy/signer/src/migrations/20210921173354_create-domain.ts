import * as Knex from 'knex'

import { DOMAINS_COLUMNS, DOMAINS_TABLE } from '../database/models/domain'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(DOMAINS_TABLE))) {
    return knex.schema.createTable(DOMAINS_TABLE, (t) => {
      t.string(DOMAINS_COLUMNS.domain).notNullable().primary()
      t.integer(DOMAINS_COLUMNS.counter).notNullable().defaultTo(0)
      t.boolean(DOMAINS_COLUMNS.disabled).notNullable().defaultTo(false)
      t.integer(DOMAINS_COLUMNS.timer).notNullable().defaultTo(0)
    })
  }

  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(DOMAINS_TABLE)
}
