import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  ErrorType,
  getContractKit,
  loggerMiddleware,
  OdisRequest,
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
import { domainDisable } from './domain/endpoints/disable/action'
import { domainQuota } from './domain/endpoints/quota/action'
import { domainSign } from './domain/endpoints/sign/action'
import { DomainQuotaService } from './domain/services/quota'
import { pnpQuota } from './pnp/endpoints/quota/action'
import { pnpSign } from './pnp/endpoints/sign/action'
import { DefaultPnpQuotaService } from './pnp/services/request-service'

import {
  catchErrorHandler,
  disabledHandler,
  Locals,
  meteringHandler,
  PromiseHandler,
  ResultHandler,
  resultHandler,
  sendFailure,
  timeoutHandler,
  tracingHandler,
} from './common/handler'
import { CachingAccountService, ContractKitAccountService } from './pnp/services/account-service'

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

  const accountService = new CachingAccountService(
    new ContractKitAccountService(logger, kit, {
      fullNodeTimeoutMs: config.fullNodeTimeoutMs,
      fullNodeRetryCount: config.fullNodeRetryCount,
      fullNodeRetryDelayMs: config.fullNodeRetryDelayMs,
    })
  )

  const pnpRequestService = new DefaultPnpQuotaService(db)
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
      pnpSign(db, config, pnpRequestService, accountService, keyProvider)
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
          catchErrorHandler2(enabled ? resultHandler(action) : disabledHandler)
        )
      )
    )
  )

  function catchErrorHandler2(handler: PromiseHandler<R>): PromiseHandler<R> {
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
