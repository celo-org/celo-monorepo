import Logger, { createLogger, levelFromName, LogLevelString, stdSerializers } from 'bunyan'
import bunyanDebugStream from 'bunyan-debug-stream'
import { createStream } from 'bunyan-gke-stackdriver'
import { NextFunction, Request, Response } from 'express'
import { WarningMessage } from '../interfaces/errors'
import { fetchEnvOrDefault } from './config.utils'

let _rootLogger: Logger | undefined

export function rootLogger(serviceName: string): Logger {
  if (_rootLogger !== undefined) {
    return _rootLogger
  }

  const logLevel = fetchEnvOrDefault('LOG_LEVEL', 'info') as LogLevelString
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

  _rootLogger = createLogger({
    name: serviceName ?? '',
    serializers: stdSerializers,
    streams: [stream],
  })
  return _rootLogger
}

export function loggerMiddleware(
  serviceName: string
): (req: Request, res: Response, next?: NextFunction) => Logger {
  return (req, res, next) => {
    const requestLogger = rootLogger(serviceName).child({
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
}

export function genSessionID() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
