import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable('number_pairs', (t) => {
    t.string('user_phone_hash').notNullable()
    t.string('contact_phone_hash').notNullable()
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('number_pairs')
}
