import { Knex } from 'knex'
import { REQUESTS_COLUMNS, REQUESTS_TABLE } from '../models/request'

export async function up(knex: Knex): Promise<any> {
  if (!(await knex.schema.hasTable(REQUESTS_TABLE))) {
    return knex.schema.createTable(REQUESTS_TABLE, (t) => {
      t.string(REQUESTS_COLUMNS.address).notNullable()
      t.dateTime(REQUESTS_COLUMNS.timestamp).notNullable()
      t.string(REQUESTS_COLUMNS.blindedQuery).notNullable()
      t.primary([
        REQUESTS_COLUMNS.address,
        // Note: timestamp isn't used on lookups and therefore hurts performance. Fixed in follow up migration.
        // (https://oracle-base.com/articles/9i/index-skip-scanning)
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
