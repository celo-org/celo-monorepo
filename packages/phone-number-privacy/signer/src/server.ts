import { timeout } from '@celo/base'
import { loggerMiddleware, rootLogger, SignerEndpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import * as PromClient from 'prom-client'
import { Counters, Histograms } from './common/metrics'
import config, { getVersion } from './config'
import { DomainDisable } from './signer/domain/disable'
import { DomainQuotaStatus } from './signer/domain/quota'
import { DomainSign } from './signer/domain/sign'
import { PnpQuota } from './signer/pnp/quota'
import { PnpSign } from './signer/pnp/sign'

require('events').EventEmitter.defaultMaxListeners = 15

export function createServer() {
  const logger = rootLogger()

  logger.info('Creating express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware)

  app.get(SignerEndpoint.STATUS, (_req, res) => {
    res.status(200).json({
      version: getVersion(),
    })
  })

  app.get(SignerEndpoint.METRICS, (_req, res) => {
    res.send(PromClient.register.metrics())
  })

  // TODO(Alec): Clean this up

  const addMeteredSignerEndpoint = (
    endpoint: SignerEndpoint,
    handler: (req: Request, res: Response) => Promise<void>,
    method: 'post' | 'get' = 'post'
  ) =>
    app[method](endpoint, async (req, res) => {
      await callAndMeterLatency(endpoint, handler, req, res)
    })

  // EG. curl -v "http://localhost:8080/getBlindedMessagePartialSig" -H "Authorization: 0xdaf63ea42a092e69b2001db3826bc81dc859bffa4d51ce8943fddc8ccfcf6b2b1f55d64e4612e7c028791528796f5a62c1d2865b184b664589696a08c83fc62a00" -d '{"hashedPhoneNumber":"0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96","blindedQueryPhoneNumber":"n/I9srniwEHm5o6t3y0tTUB5fn7xjxRrLP1F/i8ORCdqV++WWiaAzUo3GA2UNHiB","account":"0x588e4b68193001e4d10928660aB4165b813717C0"}' -H 'Content-Type: application/json'
  const pnpSign = new PnpSign(config)
  addMeteredSignerEndpoint(SignerEndpoint.PARTIAL_SIGN_MESSAGE, pnpSign.handle)
  const pnpQuota = new PnpQuota(config)
  addMeteredSignerEndpoint(SignerEndpoint.GET_QUOTA, pnpQuota.handle)
  const domainQuotaStatus = new DomainQuotaStatus(config)
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_QUOTA_STATUS, domainQuotaStatus.handle)
  const domainSign = new DomainSign(config)
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_SIGN, domainSign.handle)
  const domainDisable = new DomainDisable(config)
  addMeteredSignerEndpoint(SignerEndpoint.DISABLE_DOMAIN, domainDisable.handle)

  const sslOptions = getSslOptions()
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
}

async function callAndMeterLatency(
  endpoint: SignerEndpoint,
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
  const logger = rootLogger()
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
