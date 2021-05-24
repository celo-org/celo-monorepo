import { rootLogger as logger } from '@celo/phone-number-privacy-common'
import config, { DEV_MODE } from './config'
import { initDatabase } from './database/database'
import { initKeyProvider } from './key-management/key-provider'
import { createServer } from './server'

async function start() {
  logger.info(`Starting. Dev mode: ${DEV_MODE}`)
  await initDatabase()
  await initKeyProvider()

  const server = createServer()
  logger.info('Starting server')
  const port = config.server.port
  const backupTimeout = config.timeout * 1.2
  server
    .listen(port, () => {
      logger.info(`Server is listening on port ${port}`)
    })
    .setTimeout(backupTimeout)
}

start().catch((err) => {
  logger.info('Fatal error occured. Exiting')
  logger.error(err)
  process.exit(1)
})
