import knex from 'knex'
import config from '../src/config'

console.info('Running migrations')
knex({
  client: 'pg',
  connection: config.db,
  debug: true,
})
  .migrate.latest({
    directory: './migrations',
    extension: 'ts',
  })
  .then((val) => console.info('Migraitons complete', val))
  .catch((reason) => console.error('Migrations failed', reason))
