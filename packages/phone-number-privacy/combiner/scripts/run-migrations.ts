// tslint:disable: no-console
// TODO de-dupe with signer script
import { initDatabase } from '../src/database/database'
import config from '../src/config'

async function start() {
  console.info('Running migrations')
  await initDatabase(config, undefined, false)
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
