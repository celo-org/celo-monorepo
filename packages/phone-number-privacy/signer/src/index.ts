import logger from './common/logger'
import config, { DEV_MODE } from './config'
import { initKeyProvider } from './key-management/key-provider'
import { app } from './server'

async function start() {
  await initKeyProvider()

  logger.info(`Starting server. Dev mode: ${DEV_MODE}`)
  const port = config.server.port
  app.listen(port, () => {
    logger.info(`Server is listening on port ${port}`)
  })
}

start().catch((e) => {
  logger.error('Fatal error occured. Exiting', e)
  process.exitCode = 1
})
