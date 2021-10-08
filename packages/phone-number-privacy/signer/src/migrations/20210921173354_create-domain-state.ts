import * as Knex from 'knex'

import { DOMAINS_STATES_COLUMNS, DOMAINS_STATES_TABLE } from '../database/models/domainState'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(DOMAINS_STATES_TABLE))) {
    return knex.schema.createTable(DOMAINS_STATES_TABLE, (t) => {
      t.string(DOMAINS_STATES_COLUMNS.domain).notNullable().primary()
      t.integer(DOMAINS_STATES_COLUMNS.counter).notNullable().defaultTo(0)
      t.boolean(DOMAINS_STATES_COLUMNS.disabled).notNullable().defaultTo(false)
      t.integer(DOMAINS_STATES_COLUMNS.timer).notNullable().defaultTo(0)
    })
  }

  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(DOMAINS_STATES_TABLE)
}
