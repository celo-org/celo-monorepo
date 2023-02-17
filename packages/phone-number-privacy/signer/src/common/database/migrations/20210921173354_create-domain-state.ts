import { Knex } from 'knex'
import { DOMAIN_STATE_COLUMNS } from '../models/domain-state'

export async function up(knex: Knex): Promise<any> {
  // Due to a name change, the old migration uses the old names of these tables
  // The change-name-domain-state migration then updates the name
  // to match the value stored in DOMAIN_STATE_TABLE
  if (!(await knex.schema.hasTable('domainsStates'))) {
    return knex.schema.createTable('domainsStates', (t) => {
      t.string(DOMAIN_STATE_COLUMNS.domainHash).notNullable().primary()
      t.integer(DOMAIN_STATE_COLUMNS.counter).nullable()
      t.boolean(DOMAIN_STATE_COLUMNS.disabled).notNullable().defaultTo(false)
      t.integer(DOMAIN_STATE_COLUMNS.timer).nullable()
    })
  }

  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('domainsStates')
}
