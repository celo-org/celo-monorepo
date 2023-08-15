import { ContractKit } from '@celo/contractkit'
import {
  DataEncryptionKeyFetcher,
  ErrorMessage,
  ErrorType,
  getContractKit,
  loggerMiddleware,
  newContractKitFetcher,
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
import { DomainDisableIO } from './domain/endpoints/disable/io'
import { createDomainQuotaHandler } from './domain/endpoints/quota/action'
import { DomainQuotaIO } from './domain/endpoints/quota/io'
import { createDomainSignHandler } from './domain/endpoints/sign/action'
import { DomainSignIO } from './domain/endpoints/sign/io'
import { DomainQuotaService } from './domain/services/quota'
import { createPnpQuotaHandler } from './pnp/endpoints/quota/action'
import { PnpQuotaIO } from './pnp/endpoints/quota/io'
import { createPnpSignHandler } from './pnp/endpoints/sign/action'
import { PnpSignIO } from './pnp/endpoints/sign/io'
import { PnpQuotaService } from './pnp/services/quota'
import opentelemetry from '@opentelemetry/api'

const tracer = opentelemetry.trace.getTracer('signer-tracer')

import {
  catchErrorHandler,
  meteringHandler,
  PromiseHandler,
  sendFailure,
  timeoutHandler,
  tracingHandler,
} from './common/handler'
import { IO } from './common/io'

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

  const pnpQuotaService = new PnpQuotaService(db, kit)
  const domainQuotaService = new DomainQuotaService(db)

  const dekFetcher = newCachingDekFetcher(
    newContractKitFetcher(
      kit,
      logger,
      config.fullNodeTimeoutMs,
      config.fullNodeRetryCount,
      config.fullNodeRetryDelayMs
    )
  )

  const pnpQuotaIO = new PnpQuotaIO(
    config.api.phoneNumberPrivacy.enabled,
    config.api.phoneNumberPrivacy.shouldFailOpen, // TODO (https://github.com/celo-org/celo-monorepo/issues/9862) consider refactoring config to make the code cleaner
    dekFetcher
  )
  const pnpQuota = createPnpQuotaHandler(pnpQuotaService, pnpQuotaIO)

  const pnpSignIO = new PnpSignIO(
    config.api.phoneNumberPrivacy.enabled,
    config.api.phoneNumberPrivacy.shouldFailOpen,
    dekFetcher
  )
  const pnpSign = createPnpSignHandler(db, config, pnpQuotaService, keyProvider, pnpSignIO)

  const domainQuotaIO = new DomainQuotaIO(config.api.domains.enabled)
  const domainQuota = createDomainQuotaHandler(domainQuotaService, domainQuotaIO)

  const domainSignIO = new DomainSignIO(config.api.domains.enabled)
  const domainSign = createDomainSignHandler(
    db,
    config,
    domainQuotaService,
    keyProvider,
    domainSignIO
  )

  const domainDisableIO = new DomainDisableIO(config.api.domains.enabled)
  const domainDisable = createDomainDisableHandler(db, domainDisableIO)

  logger.info('Right before adding meteredSignerEndpoints')

  app.post(SignerEndpoint.PNP_SIGN, createHandler(config.timeout, pnpSignIO, pnpSign))
  app.post(SignerEndpoint.PNP_QUOTA, createHandler(config.timeout, pnpQuotaIO, pnpQuota))
  app.post(
    SignerEndpoint.DOMAIN_QUOTA_STATUS,
    createHandler(config.timeout, domainQuotaIO, domainQuota)
  )
  app.post(SignerEndpoint.DOMAIN_SIGN, createHandler(config.timeout, domainSignIO, domainSign))
  app.post(
    SignerEndpoint.DISABLE_DOMAIN,
    createHandler(config.timeout, domainDisableIO, domainDisable)
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

function newCachingDekFetcher(baseFetcher: DataEncryptionKeyFetcher): DataEncryptionKeyFetcher {
  const cache: Map<string, string> = new Map()
  // TODO: this doesn't work, caches for eternity

  async function cachedDekFetcher(address: string): Promise<string> {
    let cached = cache.get(address)
    if (!cached) {
      cached = await baseFetcher(address)
      cache.set(address, cached)
    }
    return cached
  }

  return cachedDekFetcher
}

function createHandler(timeoutMs: number, io: IO<any>, action: PromiseHandler): RequestHandler {
  return catchErrorHandler(
    tracingHandler(
      meteringHandler(
        Histograms.responseLatency,
        timeoutHandler(timeoutMs, actionHandler(io, action))
      )
    )
  )
}

// TODO handle action generic type
function actionHandler(io: IO<any>, action: PromiseHandler): PromiseHandler {
  // TODO handle timeout MS
  return async (request, response) => {
    const logger = response.locals.logger

    tracer
      .startActiveSpan('Controller - handle', async (span) => {
        span.addEvent('Calling init')

        const session = await io.init(request, response)
        // Init returns a response to the user internally.
        if (session) {
          span.addEvent('Calling perform')
          await action(request, response)
        }
        span.end()
      })
      .catch((err: any) => {
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
      })
  }
}
