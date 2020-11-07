// tslint:disable: no-console
import { initDatabase } from '../src/database/database'

async function start() {
  console.info('Running migrations')
  console.warn('It is no longer necessary to run db migrations seperately prior to startup')
  await initDatabase(false)
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
