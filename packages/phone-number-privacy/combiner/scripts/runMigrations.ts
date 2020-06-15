// tslint:disable: no-console
import knex from 'knex'
import config from '../src/config'

function start() {
  console.info('Running migrations')
  // Adding a timeout because knex migrations seem to hang even when they succeed
  const timeout = new Promise((resolve) => {
    setTimeout(() => {
      resolve('')
    }, 30 * 1000)
  })

  const migration = knex({
    client: 'pg',
    connection: config.db,
  }).migrate.latest({
    directory: './migrations',
    extension: 'ts',
  })

  return Promise.race([migration, timeout])
}

start()
  .then(() => console.info('Migraitons complete'))
  .catch(() => console.error('Migrations failed'))
