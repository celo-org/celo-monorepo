import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { NextFunction, Request, Response } from 'express'
import { WarningMessage } from '../interfaces/error-utils'
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

export const rootLogger: Logger = createLogger({
  name: serviceName,
  serializers: stdSerializers,
  streams: [stream],
})

export function loggerMiddleware(req: Request, res: Response, next?: NextFunction): Logger {
  const requestLogger = rootLogger.child({
    endpoint: req.path,
    sessionID: req.body.sessionID, // May be undefined
  })
  res.locals.logger = requestLogger

  if (!req.body.sessionID && req.path !== '/metrics' && req.path !== '/status') {
    requestLogger.info(WarningMessage.MISSING_SESSION_ID)
  }

  if (next) {
    next()
  }
  return requestLogger
}

export function genSessionID() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
