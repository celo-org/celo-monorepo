import * as Knex from 'knex'
import { DOMAIN_STATE_COLUMNS, DOMAIN_STATE_TABLE } from '../database/models/domainState'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(DOMAIN_STATE_TABLE))) {
    return knex.schema.createTable(DOMAIN_STATE_TABLE, (t) => {
      t.string(DOMAIN_STATE_COLUMNS.domainHash).notNullable().primary()
      t.integer(DOMAIN_STATE_COLUMNS.counter).nullable()
      t.boolean(DOMAIN_STATE_COLUMNS.disabled).notNullable().defaultTo(false)
      t.integer(DOMAIN_STATE_COLUMNS.timer).nullable()
    })
  }

  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(DOMAIN_STATE_TABLE)
}
