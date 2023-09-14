import { ContractKit } from '@celo/contractkit'
import {
  getContractKitWithAgent,
  loggerMiddleware,
  OdisRequest,
  rootLogger,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import express, { Express, RequestHandler } from 'express'
import fs from 'fs'
import https from 'https'
import { Knex } from 'knex'
import { IncomingMessage, ServerResponse } from 'node:http'
import * as PromClient from 'prom-client'
import {
  catchErrorHandler,
  connectionClosedHandler,
  disabledHandler,
  Locals,
  meteringHandler,
  ResultHandler,
  resultHandler,
  timeoutHandler,
  tracingHandler,
} from './common/handler'
import { KeyProvider } from './common/key-management/key-provider-base'
import { Histograms } from './common/metrics'
import { getSignerVersion, SignerConfig } from './config'
import { domainDisable } from './domain/endpoints/disable/action'
import { domainQuota } from './domain/endpoints/quota/action'
import { domainSign } from './domain/endpoints/sign/action'
import { DomainQuotaService } from './domain/services/quota'
import { pnpQuota } from './pnp/endpoints/quota/action'
import { pnpSign } from './pnp/endpoints/sign/action'
import {
  CachingAccountService,
  ContractKitAccountService,
  MockAccountService,
} from './pnp/services/account-service'
import { DefaultPnpRequestService, MockPnpRequestService } from './pnp/services/request-service'

require('events').EventEmitter.defaultMaxListeners = 15

export function startSigner(
  config: SignerConfig,
  db: Knex,
  keyProvider: KeyProvider,
  kit?: ContractKit
): Express | https.Server<typeof IncomingMessage, typeof ServerResponse> {
  const logger = rootLogger(config.serviceName)

  kit = kit ?? getContractKitWithAgent(config.blockchain)

  logger.info('Creating signer express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }) as RequestHandler, loggerMiddleware(config.serviceName))

  app.get(SignerEndpoint.STATUS, (_req, res) => {
    res.status(200).json({
      version: getSignerVersion(),
    })
  })

  app.get(SignerEndpoint.METRICS, (_req, res) => {
    res.send(PromClient.register.metrics())
  })

  const baseAccountService = config.shouldMockAccountService
    ? new MockAccountService(config.mockDek, config.mockTotalQuota)
    : new ContractKitAccountService(logger, kit)

  const accountService = new CachingAccountService(baseAccountService)

  const pnpRequestService = config.shouldMockRequestService
    ? new MockPnpRequestService()
    : new DefaultPnpRequestService(db)
  const domainQuotaService = new DomainQuotaService(db)

  logger.info('Right before adding meteredSignerEndpoints')

  const {
    timeout,
    api: { domains, phoneNumberPrivacy },
  } = config

  app.post(
    SignerEndpoint.PNP_SIGN,
    createHandler(
      timeout,
      phoneNumberPrivacy.enabled,
      pnpSign(config, pnpRequestService, accountService, keyProvider)
    )
  )
  app.post(
    SignerEndpoint.PNP_QUOTA,
    createHandler(timeout, phoneNumberPrivacy.enabled, pnpQuota(pnpRequestService, accountService))
  )
  app.post(
    SignerEndpoint.DOMAIN_QUOTA_STATUS,
    createHandler(timeout, domains.enabled, domainQuota(domainQuotaService))
  )
  app.post(
    SignerEndpoint.DOMAIN_SIGN,
    createHandler(timeout, domains.enabled, domainSign(db, config, domainQuotaService, keyProvider))
  )
  app.post(
    SignerEndpoint.DISABLE_DOMAIN,
    createHandler(timeout, domains.enabled, domainDisable(db))
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

function createHandler<R extends OdisRequest>(
  timeoutMs: number,
  enabled: boolean,
  action: ResultHandler<R>
): RequestHandler<{}, {}, R, {}, Locals> {
  return catchErrorHandler(
    tracingHandler(
      meteringHandler(
        Histograms.responseLatency,
        timeoutHandler(
          timeoutMs,
          enabled ? connectionClosedHandler(resultHandler(action)) : disabledHandler
        )
      )
    )
  )
}
