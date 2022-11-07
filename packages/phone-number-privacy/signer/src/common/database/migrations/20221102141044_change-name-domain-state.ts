import { Knex } from 'knex'
import { DOMAIN_STATE_TABLE } from '../models/domain-state'

// The original create-domain-state migration used a different name for DOMAIN_STATE_TABLE
export async function up(knex: Knex): Promise<void> {
  return knex.schema.renameTable('domainsStates', DOMAIN_STATE_TABLE)
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.renameTable(DOMAIN_STATE_TABLE, 'domainsStates')
}
