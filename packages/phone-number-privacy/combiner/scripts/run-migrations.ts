// tslint:disable: no-console
// TODO de-dupe with signer script
import knex from 'knex'
import config from '../src/config'

async function start() {
  console.info('Running migrations')
  await knex({
    client: 'pg',
    connection: config.db,
  }).migrate.latest({
    directory: './migrations',
    extension: 'ts',
  })
}

start()
  .then(() => {
    console.info('Migrations complete')
    process.exit(0)
  })
  .catch((e) => {
    console.error('Migration failed', e)
    process.exit(1)
  })
