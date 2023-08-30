// tslint:disable: no-console

import { initDatabase } from '../src/common/database/database'
import { config } from '../src/config'

async function start() {
  console.info('Running migrations')
  console.warn('It is no longer necessary to run db migrations seperately prior to startup')
  await initDatabase(config, undefined)
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
