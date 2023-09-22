import { rootLogger } from '@celo/phone-number-privacy-common'
import { config, DEV_MODE } from './config'
import { startCombiner } from './server'

require('dotenv').config()

async function start() {
  const logger = rootLogger(config.serviceName)
  logger.info(`Starting. Dev mode: ${DEV_MODE}`)

  logger.info('Starting server')
  const server = startCombiner(config)
  // const server = startCombiner(config, getContractKitWithAgent(config.blockchain))

  const port = config.server.port ?? 0
  server.listen(port, () => {
    logger.info(`Server is listening on port ${port}`)
  })
}

start().catch((err) => {
  const logger = rootLogger(config.serviceName)
  logger.error({ err }, 'Fatal error occured. Exiting')
  process.exit(1)
})

export * from './config'
export * from './server'
