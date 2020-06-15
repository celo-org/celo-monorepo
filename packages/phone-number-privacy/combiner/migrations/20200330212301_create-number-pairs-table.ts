import * as Knex from 'knex'
import { NUMBER_PAIRS_COLUMN, NUMBER_PAIRS_TABLE } from '../src/database/models/numberPair'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable(NUMBER_PAIRS_TABLE, (t) => {
    t.string(NUMBER_PAIRS_COLUMN.userPhoneHash).notNullable()
    t.string(NUMBER_PAIRS_COLUMN.contactPhoneHash).notNullable()
    t.unique([NUMBER_PAIRS_COLUMN.userPhoneHash, NUMBER_PAIRS_COLUMN.contactPhoneHash])
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable(NUMBER_PAIRS_TABLE)
}
