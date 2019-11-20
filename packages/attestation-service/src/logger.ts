import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import { createStream } from 'bunyan-gke-stackdriver'
import { fetchEnvOrDefault } from './env'

const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'info') as LogLevelString
const logFormat = fetchEnvOrDefault('LOG_FORMAT', 'default')

const stream =
  logFormat === 'stackdriver'
    ? createStream(levelFromName[logLevel])
    : { stream: process.stdout, level: logLevel }

export const rootLogger: Logger = createLogger({
  name: 'attestation-service',
  serializers: stdSerializers,
  streams: [stream],
})
