import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
// @ts-ignore
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { fetchEnvOrDefault } from './env'

const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'debug') as LogLevelString
const logFormat = fetchEnvOrDefault('LOG_FORMAT', 'human')

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
  name: 'metadata-crawler',
  serializers: stdSerializers,
  streams: [stream],
})
