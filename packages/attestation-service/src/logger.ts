import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { fetchEnvOrDefault } from './env'

const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'info') as LogLevelString
const logFormat = fetchEnvOrDefault('LOG_FORMAT', 'json')

let stream: any
switch (logFormat) {
  case 'stackdriver':
    stream = createStream(levelFromName[logLevel])
    break
  case 'human':
    stream = { level: logLevel, stream: bunyanDebugStream() }
    break
  default:
    stream = { stream: process.stdout, level: logLevel }
    break
}

export const rootLogger: Logger = createLogger({
  name: 'attestation-service',
  serializers: stdSerializers,
  streams: [stream],
})
