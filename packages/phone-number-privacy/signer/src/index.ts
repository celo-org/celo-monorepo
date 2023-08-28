import { getContractKitWithAgent, rootLogger } from '@celo/phone-number-privacy-common'
import { CronJob } from 'cron'
import { Knex } from 'knex'
import { initDatabase } from './common/database/database'
import { initKeyProvider } from './common/key-management/key-provider'
import { KeyProvider } from './common/key-management/key-provider-base'
import { config, DEV_MODE, SupportedDatabase, SupportedKeystore } from './config'
import { DefaultPnpRequestService, MockPnpRequestService } from './pnp/services/request-service'
import { startSigner } from './server'

require('dotenv').config()

if (DEV_MODE) {
  config.db.type = SupportedDatabase.Sqlite
  config.keystore.type = SupportedKeystore.MOCK_SECRET_MANAGER
}
let databasePrunner: CronJob

async function start() {
  const logger = rootLogger(config.serviceName)
  logger.info(`Starting. Dev mode: ${DEV_MODE}`)
  const db = await initDatabase(config)
  const keyProvider: KeyProvider = await initKeyProvider(config)
  const server = startSigner(config, db, keyProvider, getContractKitWithAgent(config.blockchain))

  logger.info('Starting database Prunner job')
  launchRequestPrunnerJob(db)

  logger.info('Starting server')
  const port = config.server.port ?? 0
  const backupTimeout = config.timeout * 1.2
  server
    .listen(port, () => {
      logger.info(`Server is listening on port ${port}`)
    })
    .setTimeout(backupTimeout)
}

function launchRequestPrunnerJob(db: Knex) {
  const ctx = {
    url: '',
    logger: rootLogger(config.serviceName),
    errors: [],
  }
  const pnpRequestService = config.shouldMockRequestService
    ? new MockPnpRequestService()
    : new DefaultPnpRequestService(db)
  databasePrunner = new CronJob({
    cronTime: config.requestPrunningJobCronPattern,
    onTick: async () => {
      ctx.logger.info('Prunning database requests')
      await pnpRequestService.removeOldRequest(config.requestPrunningDays, ctx)
    },
    timeZone: 'UTC',
    runOnInit: config.requestPrunningAtServerStart,
  })
  databasePrunner.start()
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
