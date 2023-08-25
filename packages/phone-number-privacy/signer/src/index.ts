import { getContractKitWithAgent, rootLogger } from '@celo/phone-number-privacy-common'
import { initDatabase } from './common/database/database'
import { initKeyProvider } from './common/key-management/key-provider'
import { KeyProvider } from './common/key-management/key-provider-base'
import { config, DEV_MODE, SupportedDatabase, SupportedKeystore } from './config'
import { startSigner } from './server'
import { CronJob } from 'cron'

require('dotenv').config()

if (DEV_MODE) {
  config.db.type = SupportedDatabase.Sqlite
  config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
}
var databasePrunner: CronJob

async function start() {
  const logger = rootLogger(config.serviceName)
  logger.info(`Starting. Dev mode: ${DEV_MODE}`)
  const db = await initDatabase(config)
  const keyProvider: KeyProvider = await initKeyProvider(config)
  const { server, databasePrunnerJob } = startSigner(
    config,
    db,
    keyProvider,
    getContractKitWithAgent(config.blockchain)
  )
  databasePrunner = databasePrunnerJob
  if (databasePrunner) {
    logger.info('Starting database Prunner job')
    databasePrunner.start()
  }
  logger.info('Starting server')
  const port = config.server.port ?? 0
  const backupTimeout = config.timeout * 1.2
  server
    .listen(port, () => {
      logger.info(`Server is listening on port ${port}`)
    })
    .setTimeout(backupTimeout)
}

start().catch((err) => {
  const logger = rootLogger(config.serviceName)
  logger.error({ err }, 'Fatal error occured. Exiting')
  databasePrunner?.stop()
  process.exit(1)
})

export { initDatabase } from './common/database/database'
export { initKeyProvider } from './common/key-management/key-provider'
export { config, SupportedDatabase, SupportedKeystore } from './config'
export * from './server'
