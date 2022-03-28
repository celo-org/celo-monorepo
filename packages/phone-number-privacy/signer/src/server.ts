import { timeout } from '@celo/base'
import { loggerMiddleware, rootLogger, SignerEndpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import * as PromClient from 'prom-client'
import { Counters, Histograms } from './common/metrics'
import config, { getVersion } from './config'
import { Controller } from './signer/controller'
import { DomainDisableAction } from './signer/domain/disable.action'
import { DomainDisableIO } from './signer/domain/disable.io'
import { DomainQuotaAction } from './signer/domain/quota.action'
import { DomainQuotaIO } from './signer/domain/quota.io'
import { DomainQuotaService } from './signer/domain/quota.service'
import { DomainSignAction } from './signer/domain/sign.action'
import { DomainSignIO } from './signer/domain/sign.io'
import { PnpQuotaAction } from './signer/pnp/quota.action'
import { PnpQuotaIO } from './signer/pnp/quota.io'
import { PnpQuotaService } from './signer/pnp/quota.service'
import { PnpSignAction } from './signer/pnp/sign.action'
import { PnpSignIO } from './signer/pnp/sign.io'

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

  // TODO(Alec): Clean this up / add to Controller class
  const addMeteredSignerEndpoint = (
    endpoint: SignerEndpoint,
    handler: (req: Request, res: Response) => Promise<void>,
    method: 'post' | 'get' = 'post'
  ) =>
    app[method](endpoint, async (req, res) => {
      await callAndMeterLatency(endpoint, handler, req, res)
    })

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

  const pnpQuotaService = new PnpQuotaService()
  const domainQuotaService = new DomainQuotaService()

  const pnpQuota = new PnpQuotaAction(config, pnpQuotaService, new PnpQuotaIO())
  const pnpSign = new PnpSignAction(config, pnpQuotaService, new PnpSignIO())
  const domainQuota = new DomainQuotaAction(config, domainQuotaService, new DomainQuotaIO())
  const domainSign = new DomainSignAction(config, domainQuotaService, new DomainSignIO())
  const domainDisable = new DomainDisableAction(config, new DomainDisableIO())

  addMeteredSignerEndpoint(SignerEndpoint.PARTIAL_SIGN_MESSAGE, new Controller(pnpSign).handle)
  addMeteredSignerEndpoint(SignerEndpoint.GET_QUOTA, new Controller(pnpQuota).handle)
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_QUOTA_STATUS, new Controller(domainQuota).handle)
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_SIGN, new Controller(domainSign).handle)
  addMeteredSignerEndpoint(SignerEndpoint.DISABLE_DOMAIN, new Controller(domainDisable).handle)

  const sslOptions = getSslOptions()
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
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
