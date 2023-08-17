import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  ErrorType,
  getContractKit,
  loggerMiddleware,
  rootLogger,
  SignerEndpoint,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import express, { Express, RequestHandler } from 'express'
import fs from 'fs'
import https from 'https'
import { Knex } from 'knex'
import { IncomingMessage, ServerResponse } from 'node:http'
import * as PromClient from 'prom-client'
import { KeyProvider } from './common/key-management/key-provider-base'
import { Histograms } from './common/metrics'
import { getSignerVersion, SignerConfig } from './config'
import { createDomainDisableHandler } from './domain/endpoints/disable/action'
import { createDomainQuotaHandler } from './domain/endpoints/quota/action'
import { createDomainSignHandler } from './domain/endpoints/sign/action'
import { DomainQuotaService } from './domain/services/quota'
import { createPnpQuotaHandler } from './pnp/endpoints/quota/action'
import { createPnpSignHandler } from './pnp/endpoints/sign/action'
import { ContractKitAccountService, DefaultPnpQuotaService } from './pnp/services/quota'

import {
  catchErrorHandler,
  disabledHandler,
  meteringHandler,
  PromiseHandler,
  sendFailure,
  timeoutHandler,
  tracingHandler,
} from './common/handler'

require('events').EventEmitter.defaultMaxListeners = 15

export function startSigner(
  config: SignerConfig,
  db: Knex,
  keyProvider: KeyProvider,
  kit?: ContractKit
): Express | https.Server<typeof IncomingMessage, typeof ServerResponse> {
  const logger = rootLogger(config.serviceName)

  kit = kit ?? getContractKit(config.blockchain)

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

  const accountService = new ContractKitAccountService(kit, {
    fullNodeTimeoutMs: config.fullNodeTimeoutMs,
    fullNodeRetryCount: config.fullNodeRetryCount,
    fullNodeRetryDelayMs: config.fullNodeRetryDelayMs,
  })
  const pnpRequestService = new DefaultPnpQuotaService(db)
  const domainQuotaService = new DomainQuotaService(db)

  const pnpQuotaHandler = config.api.phoneNumberPrivacy.enabled
    ? createPnpQuotaHandler(pnpRequestService, accountService)
    : disabledHandler

  const pnpSignHandler = config.api.phoneNumberPrivacy.enabled
    ? createPnpSignHandler(db, config, pnpRequestService, accountService, keyProvider)
    : disabledHandler

  const domainQuota = config.api.domains.enabled
    ? createDomainQuotaHandler(domainQuotaService)
    : disabledHandler

  const domainSign = config.api.domains.enabled
    ? createDomainSignHandler(db, config, domainQuotaService, keyProvider)
    : disabledHandler

  const domainDisable = config.api.domains.enabled
    ? createDomainDisableHandler(db)
    : disabledHandler

  logger.info('Right before adding meteredSignerEndpoints')

  app.post(SignerEndpoint.PNP_SIGN, createHandler(config.timeout, pnpSignHandler))
  app.post(SignerEndpoint.PNP_QUOTA, createHandler(config.timeout, pnpQuotaHandler))
  app.post(SignerEndpoint.DOMAIN_QUOTA_STATUS, createHandler(config.timeout, domainQuota))
  app.post(SignerEndpoint.DOMAIN_SIGN, createHandler(config.timeout, domainSign))
  app.post(SignerEndpoint.DISABLE_DOMAIN, createHandler(config.timeout, domainDisable))

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

function createHandler(timeoutMs: number, action: PromiseHandler): RequestHandler {
  return catchErrorHandler(
    tracingHandler(
      meteringHandler(
        Histograms.responseLatency,
        timeoutHandler(timeoutMs, catchErrorHandler2(action))
      )
    )
  )

  function catchErrorHandler2(handler: PromiseHandler): PromiseHandler {
    return async (request, response) => {
      try {
        await handler(request, response)
      } catch (err: any) {
        const logger = response.locals.logger
        logger.error({ err }, `Error in handler for ${request.url}`)

        let errMsg: ErrorType = ErrorMessage.UNKNOWN_ERROR
        if (
          err instanceof Error &&
          // Propagate standard error & warning messages thrown during endpoint handling
          (Object.values(ErrorMessage).includes(err.message as ErrorMessage) ||
            Object.values(WarningMessage).includes(err.message as WarningMessage))
        ) {
          errMsg = err.message as ErrorType
        }

        sendFailure(errMsg, 500, response)
      }
    }
  }
}
