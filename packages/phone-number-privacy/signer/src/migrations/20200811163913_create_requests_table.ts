import * as Knex from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../database/models/request'

export async function up(knex: Knex): Promise<any> {
  // This check was necessary to switch from using .ts migrations to .js migrations.
  if (!(await knex.schema.hasTable(REQUESTS_TABLE))) {
    return knex.schema.createTable(REQUESTS_TABLE, (t) => {
      t.string(REQUESTS_COLUMNS.address).notNullable()
      t.dateTime(REQUESTS_COLUMNS.timestamp).notNullable()
      t.string(REQUESTS_COLUMNS.blindedQuery).notNullable()
      t.primary([
        REQUESTS_COLUMNS.address,
        REQUESTS_COLUMNS.timestamp,
        REQUESTS_COLUMNS.blindedQuery,
      ])
    })
  }
  return null
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(REQUESTS_TABLE)
}
