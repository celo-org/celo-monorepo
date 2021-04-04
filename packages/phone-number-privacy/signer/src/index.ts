import { rootLogger as logger } from '@celo/phone-number-privacy-common'
import cluster from 'cluster'
import config, { DEV_MODE } from './config'
import { initDatabase } from './database/database'
import { initKeyProvider } from './key-management/key-provider'
import { createServer } from './server'

async function startServer() {
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

const numCPUs = require('os').cpus().length
const userConcurrency = parseInt(process.env.CONCURRENCY!) || numCPUs

if (userConcurrency == 1) {
  startServer().catch((err) => {
    logger.info('Fatal error occured. Exiting')
    logger.error(err)
    process.exit(1)
  })
} else {
  logger.info(`Running with concurrency: ${userConcurrency}`)

  if (cluster.isMaster) {
    logger.info(`Main process is starting: ${process.pid}`)

    // Fork workers.
    for (let i = 0; i < userConcurrency; i++) {
      cluster.fork()
    }

    cluster.on('exit', (worker, _code, _signal) => {
      console.log(`worker ${worker.process.pid} died`)
      cluster.fork() // Create a New Worker, If Worker is Dead
    })
  } else {
    logger.info(`Worker process server start: ${process.pid}`)
    startServer().catch((err) => {
      logger.info('Fatal error occured. Exiting')
      logger.error(err)
      process.exit(1)
    })
  }
}
