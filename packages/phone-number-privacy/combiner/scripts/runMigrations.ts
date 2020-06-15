// tslint:disable: no-console
import knex from 'knex'
import config from '../src/config'

async function start() {
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

  await Promise.race([migration, timeout])
  console.info('Migrations complete')
}

// tslint:disable-next-line: no-floating-promises
start()
