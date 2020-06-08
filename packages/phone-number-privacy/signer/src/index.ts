import logger from './common/logger'
import config, { DEV_MODE } from './config'
import { app } from './server'

const port = config.server.port
logger.info(`Starting server. Dev mode: ${DEV_MODE}`)
app.listen(port, () => {
  logger.info(`Server is listening on port ${port}`)
})
