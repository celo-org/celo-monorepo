import { timeout } from '@celo/base'
import { loggerMiddleware, rootLogger, SignerEndpoint } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import { Knex } from 'knex'
import * as PromClient from 'prom-client'
import { Controller } from './common/controller'
import { KeyProvider } from './common/key-management/key-provider-base'
import { Counters, Histograms } from './common/metrics'
import { getContractKit } from './common/web3/contracts'
import { getVersion, SignerConfig } from './config'
import { DomainDisableAction } from './domain/endpoints/disable/action'
import { DomainDisableIO } from './domain/endpoints/disable/io'
import { DomainQuotaAction } from './domain/endpoints/quota/action'
import { DomainQuotaIO } from './domain/endpoints/quota/io'
import { DomainSignAction } from './domain/endpoints/sign/action'
import { DomainSignIO } from './domain/endpoints/sign/io'
import { DomainQuotaService } from './domain/services/quota'
import { PnpQuotaAction } from './pnp/endpoints/quota/action'
import { PnpQuotaIO } from './pnp/endpoints/quota/io'
import { PnpSignAction } from './pnp/endpoints/sign/action'
import { PnpSignIO } from './pnp/endpoints/sign/io'
import { LegacyPnpQuotaService } from './pnp/services/quota.legacy'
import { OnChainPnpQuotaService } from './pnp/services/quota.onchain'

require('events').EventEmitter.defaultMaxListeners = 15

export function startSigner(config: SignerConfig, db: Knex, keyProvider: KeyProvider) {
  const logger = rootLogger(config.serviceName)

  logger.info('Creating signer express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware(config.serviceName))

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

  const kit = getContractKit(config)

  const pnpQuotaService = new OnChainPnpQuotaService(db, kit)
  const legacyPnpQuotaService = new LegacyPnpQuotaService(db, kit)
  const domainQuotaService = new DomainQuotaService(db)

  const pnpQuota = new Controller(
    new PnpQuotaAction(
      config,
      pnpQuotaService,
      new PnpQuotaIO(config.api.phoneNumberPrivacy.enabled, kit)
    )
  )
  const pnpSign = new Controller(
    new PnpSignAction(
      db,
      config,
      pnpQuotaService,
      keyProvider,
      new PnpSignIO(config.api.phoneNumberPrivacy.enabled, kit)
    )
  )
  const legacyPnpSign = new Controller(
    new PnpSignAction(
      db,
      config,
      legacyPnpQuotaService,
      keyProvider,
      new PnpSignIO(config.api.phoneNumberPrivacy.enabled, kit)
    )
  )
  const legacyPnpQuota = new Controller(
    new PnpQuotaAction(
      config,
      legacyPnpQuotaService,
      new PnpQuotaIO(config.api.phoneNumberPrivacy.enabled, kit)
    )
  )
  const domainQuota = new Controller(
    new DomainQuotaAction(config, domainQuotaService, new DomainQuotaIO(config.api.domains.enabled))
  )
  const domainSign = new Controller(
    new DomainSignAction(
      db,
      config,
      domainQuotaService,
      keyProvider,
      new DomainSignIO(config.api.domains.enabled)
    )
  )
  const domainDisable = new Controller(
    new DomainDisableAction(config, new DomainDisableIO(config.api.domains.enabled), db) // TODO: param ordering
  )

  addMeteredSignerEndpoint(SignerEndpoint.PNP_SIGN, pnpSign.handle.bind(pnpSign))
  addMeteredSignerEndpoint(SignerEndpoint.PNP_QUOTA, pnpQuota.handle.bind(pnpQuota), 'get')
  addMeteredSignerEndpoint(
    SignerEndpoint.DOMAIN_QUOTA_STATUS,
    domainQuota.handle.bind(domainQuota),
    'get'
  )
  addMeteredSignerEndpoint(SignerEndpoint.DOMAIN_SIGN, domainSign.handle.bind(domainSign))
  addMeteredSignerEndpoint(SignerEndpoint.DISABLE_DOMAIN, domainDisable.handle.bind(domainDisable))

  addMeteredSignerEndpoint(SignerEndpoint.LEGACY_PNP_SIGN, legacyPnpSign.handle.bind(legacyPnpSign))
  addMeteredSignerEndpoint(
    SignerEndpoint.LEGACY_PNP_QUOTA,
    legacyPnpQuota.handle.bind(legacyPnpQuota),
    'get'
  )

  const sslOptions = getSslOptions(config)
  if (sslOptions) {
    return https.createServer(sslOptions, app)
  } else {
    return app
  }
}

function getSslOptions(config: SignerConfig) {
  const logger = rootLogger(config.serviceName)
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
