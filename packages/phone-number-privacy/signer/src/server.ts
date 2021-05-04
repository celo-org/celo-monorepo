import { timeout } from '@celo/base'
import { loggerMiddleware, rootLogger as logger } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import * as PromClient from 'prom-client'
import { Counters, Histograms } from './common/metrics'
import config, { getVersion } from './config'
import { handleGetBlindedMessagePartialSig } from './signing/get-partial-signature'
import { handleGetQuota } from './signing/query-quota'

require('events').EventEmitter.defaultMaxListeners = 15

export enum Endpoints {
  STATUS = '/status',
  METRICS = '/metrics',
  GET_BLINDED_MESSAGE_PARTIAL_SIG = '/getBlindedMessagePartialSig',
  GET_QUOTA = '/getQuota',
}

export function createServer() {
  logger.info('Creating express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware)

  app.get(Endpoints.STATUS, (_req, res) => {
    res.status(200).json({
      version: getVersion(),
    })
  })

  app.get(Endpoints.METRICS, (_req, res) => {
    res.send(PromClient.register.metrics())
  })

  const addMeteredEndpoint = (
    endpoint: Endpoints,
    handler: (req: Request, res: Response) => Promise<void>
  ) =>
    app.post(endpoint, async (req, res) => {
      await callAndMeterLatency(endpoint, handler, req, res)
    })

  // EG. curl -v "http://localhost:8080/getBlindedMessagePartialSig" -H "Authorization: 0xdaf63ea42a092e69b2001db3826bc81dc859bffa4d51ce8943fddc8ccfcf6b2b1f55d64e4612e7c028791528796f5a62c1d2865b184b664589696a08c83fc62a00" -d '{"hashedPhoneNumber":"0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96","blindedQueryPhoneNumber":"n/I9srniwEHm5o6t3y0tTUB5fn7xjxRrLP1F/i8ORCdqV++WWiaAzUo3GA2UNHiB","account":"0x588e4b68193001e4d10928660aB4165b813717C0"}' -H 'Content-Type: application/json'
  addMeteredEndpoint(Endpoints.GET_BLINDED_MESSAGE_PARTIAL_SIG, handleGetBlindedMessagePartialSig)
  addMeteredEndpoint(Endpoints.GET_QUOTA, handleGetQuota)

  const sslOptions = getSslOptions()
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
}

async function callAndMeterLatency(
  endpoint: Endpoints,
  handler: (req: Request, res: Response) => Promise<void>,
  req: Request,
  res: Response
) {
  const childLogger: Logger = res.locals.logger
  const end = Histograms.responseLatency.labels(endpoint).startTimer()
  const timeoutRes = Symbol()
  await timeout(handler, [req, res], config.timeout, timeoutRes)
    .catch((error: any) => {
      if (error === timeoutRes) {
        Counters.timeouts.inc()
        childLogger.warn(`Timed out after ${config.timeout}ms`)
      }
    })
    .finally(end)
}

function getSslOptions() {
  const { sslKeyPath, sslCertPath } = config.server

  if (!sslKeyPath || !sslCertPath) {
    logger.info('No SSL configs specified')
    return null
  }

  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    logger.error('SSL cert files not found')
    return null
  }

  return {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  }
}
