import { timeout } from '@celo/base'
import { loggerMiddleware, rootLogger, SignerEndpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import * as PromClient from 'prom-client'
import { Counters, Histograms } from './common/metrics'
import { Config, getVersion } from './config'
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

export function createServer(config: Config) {
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

  // TODO: Clean this up / maybe roll into to Controller class
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

  const pnpQuota = new Controller(
    new PnpQuotaAction(
      config,
      pnpQuotaService,
      new PnpQuotaIO(config.api.phoneNumberPrivacy.enabled)
    )
  )
  const pnpSign = new Controller(
    new PnpSignAction(config, pnpQuotaService, new PnpSignIO(config.api.phoneNumberPrivacy.enabled))
  )
  const domainQuota = new Controller(
    new DomainQuotaAction(config, domainQuotaService, new DomainQuotaIO(config.api.domains.enabled))
  )
  const domainSign = new Controller(
    new DomainSignAction(config, domainQuotaService, new DomainSignIO(config.api.domains.enabled))
  )
  const domainDisable = new Controller(
    new DomainDisableAction(config, new DomainDisableIO(config.api.domains.enabled))
  )

  addMeteredSignerEndpoint(SignerEndpoint.PARTIAL_SIGN_MESSAGE, pnpSign.handle.bind(pnpSign))
  addMeteredSignerEndpoint(SignerEndpoint.GET_QUOTA, pnpQuota.handle.bind(pnpQuota))
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_QUOTA_STATUS, domainQuota.handle.bind(domainQuota))
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_SIGN, domainSign.handle.bind(domainSign))
  addMeteredSignerEndpoint(SignerEndpoint.DISABLE_DOMAIN, domainDisable.handle.bind(domainDisable))

  const sslOptions = getSslOptions(config)
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
}

function getSslOptions(config: Config) {
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
