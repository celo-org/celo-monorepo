import { rootLogger } from '@celo/phone-number-privacy-common'
import { config, DEV_MODE } from './config'
import { initDatabase } from './database/database'
import { initKeyProvider } from './key-management/key-provider'
import { KeyProvider } from './key-management/key-provider-base'
import { startSigner } from './server'

require('dotenv').config()

async function start() {
  const logger = rootLogger()
  logger.info(`Starting. Dev mode: ${DEV_MODE}`)
  const db = await initDatabase(config)
  const keyProvider: KeyProvider = await initKeyProvider(config)

  const server = startSigner(config, db, keyProvider)
  logger.info('Starting server')
  const port = config.server.port ?? 0
  const backupTimeout = config.timeout * 1.2
  server
    .listen(port, () => {
      logger.info(`Server is listening on port ${port}`)
    })
    .setTimeout(backupTimeout)
}

if (!DEV_MODE) {
  start().catch((err) => {
    const logger = rootLogger()
    logger.error({ err }, 'Fatal error occured. Exiting')
    process.exit(1)
  })
}

export { config, SupportedDatabase, SupportedKeystore } from './config'
export { initDatabase } from './database/database'
export { initKeyProvider } from './key-management/key-provider'
export * from './server'
