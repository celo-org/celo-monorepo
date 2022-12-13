import { Knex } from 'knex'
import { DOMAIN_REQUESTS_COLUMNS, DOMAIN_REQUESTS_TABLE } from '../models/domain-request'

// The goal of this migration is to ensure that the timestamp column is
// not nullable, to make sure that all signers' DB states end up in the same place
// despite the required change in the old migration from nullable -> nonNullable
// for the timestamp column (due to errors in MySQL).
// Revisit all of this when returning to:
// https://github.com/celo-org/celo-monorepo/issues/9909
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
