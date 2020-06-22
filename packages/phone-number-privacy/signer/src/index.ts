import logger from './common/logger'
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
  server.listen(port, () => {
    logger.info(`Server is listening on port ${port}`)
  })
}

start().catch((e) => {
  logger.error('Fatal error occured. Exiting', e)
  process.exit(1)
})
