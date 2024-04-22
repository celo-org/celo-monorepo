import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { fetchEnvOrDefault } from './env'

const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'info') as LogLevelString
const logFormat = fetchEnvOrDefault('LOG_FORMAT', 'human')

const streams: Logger.LoggerOptions['streams'] = []
switch (logFormat) {
  case 'stackdriver':
    streams.push(createStream(levelFromName[logLevel]))
    break
  case 'json':
    streams.push({ stream: process.stdout, level: logLevel })
    break
  default:
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    streams.push({
      level: logLevel,
      stream: bunyanDebugStream() as unknown as NodeJS.WritableStream,
    })
    break
}

export const rootLogger: Logger = createLogger({
  name: 'env-tests',
  serializers: stdSerializers,
  streams,
})
