import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable('accounts', (t) => {
    t.increments('id')
      .unsigned()
      .primary()
    t.dateTime('createdAt').notNullable()
    t.string('address').notNullable()
    t.integer('num_lookups').unsigned()
    t.dateTime('did_matchmaking')
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('accounts')
}
