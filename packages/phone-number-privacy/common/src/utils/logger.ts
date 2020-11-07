import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { fetchEnv, fetchEnvOrDefault } from './config-utils'

const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'info') as LogLevelString
const logFormat = fetchEnvOrDefault('LOG_FORMAT', 'human')
const serviceName = fetchEnv('SERVICE_NAME')

let stream: any
switch (logFormat) {
  case 'stackdriver':
    stream = createStream(levelFromName[logLevel])
    break
  case 'json':
    stream = { stream: process.stdout, level: logLevel }
    break
  default:
    stream = { level: logLevel, stream: bunyanDebugStream() }
    break
}

export const logger: Logger = createLogger({
  name: serviceName,
  serializers: stdSerializers,
  streams: [stream],
})
