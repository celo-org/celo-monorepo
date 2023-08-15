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
import Logger from 'bunyan'
import express, { Express, Request, RequestHandler, Response } from 'express'
import fs from 'fs'
import https from 'https'
import { Knex } from 'knex'
import { IncomingMessage, ServerResponse } from 'node:http'
import * as PromClient from 'prom-client'

import { KeyProvider } from './common/key-management/key-provider-base'
import { Counters, Histograms, newMeter } from './common/metrics'
import { getSignerVersion, SignerConfig } from './config'
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
import { PnpQuotaService } from './pnp/services/quota'

import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { Action } from './common/action'
const tracer = opentelemetry.trace.getTracer('signer-tracer')

import * as client from 'prom-client'

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

  const pnpQuota = new PnpQuotaAction(
    config,
    pnpQuotaService,
    new PnpQuotaIO(
      config.api.phoneNumberPrivacy.enabled,
      config.api.phoneNumberPrivacy.shouldFailOpen, // TODO (https://github.com/celo-org/celo-monorepo/issues/9862) consider refactoring config to make the code cleaner
      dekFetcher
    )
  )

  const pnpSign = new PnpSignAction(
    db,
    config,
    pnpQuotaService,
    keyProvider,
    new PnpSignIO(
      config.api.phoneNumberPrivacy.enabled,
      config.api.phoneNumberPrivacy.shouldFailOpen,
      dekFetcher
    )
  )

  const domainQuota = new DomainQuotaAction(
    config,
    domainQuotaService,
    new DomainQuotaIO(config.api.domains.enabled)
  )

  const domainSign = new DomainSignAction(
    db,
    config,
    domainQuotaService,
    keyProvider,
    new DomainSignIO(config.api.domains.enabled)
  )

  const domainDisable = new DomainDisableAction(
    db,
    config,
    new DomainDisableIO(config.api.domains.enabled)
  )

  logger.info('Right before adding meteredSignerEndpoints')

  app.post(SignerEndpoint.PNP_SIGN, createHandler(pnpSign))
  app.post(SignerEndpoint.PNP_QUOTA, createHandler(pnpQuota))
  app.post(SignerEndpoint.DOMAIN_QUOTA_STATUS, createHandler(domainQuota))
  app.post(SignerEndpoint.DOMAIN_SIGN, createHandler(domainSign))
  app.post(SignerEndpoint.DISABLE_DOMAIN, createHandler(domainDisable))

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

type PromiseHandler = (request: Request, res: Response) => Promise<void>

function createHandler(action: Action<any>): RequestHandler {
  return catchErrorHandler(
    tracingHandler(meteringHandler(Histograms.responseLatency, actionHandler(action)))
  )
}

function catchErrorHandler(handler: PromiseHandler): PromiseHandler {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err: any) {
      // Handle any errors that otherwise managed to escape the proper handlers
      const logger: Logger = res.locals.logger
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      Counters.errorsCaughtInEndpointHandler.inc()

      if (!res.headersSent) {
        logger.info('Responding with error in outer endpoint handler')
        res.status(500).json({
          success: false,
          error: ErrorMessage.UNKNOWN_ERROR,
        })
      } else {
        // Getting to this error likely indicates that the `perform` process
        // does not terminate after sending a response, and then throws an error.
        logger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
        Counters.errorsThrownAfterResponseSent.inc()
      }
    }
  }
}

function tracingHandler(handler: PromiseHandler): PromiseHandler {
  return async (req, res) => {
    return tracer.startActiveSpan('server - addEndpoint - post', async (parentSpan) => {
      try {
        parentSpan.addEvent('Called ' + req.path)
        parentSpan.setAttribute(SemanticAttributes.HTTP_ROUTE, req.path)
        parentSpan.setAttribute(SemanticAttributes.HTTP_METHOD, req.method)
        parentSpan.setAttribute(SemanticAttributes.HTTP_CLIENT_IP, req.ip)

        await handler(req, res)
      } catch (err: any) {
        parentSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Fail',
        })
        throw err
      } finally {
        parentSpan.end()
      }
    })
  }
}

function meteringHandler(
  histogram: client.Histogram<string>,
  handler: PromiseHandler
): PromiseHandler {
  return (req, res) => newMeter(histogram, req.url)(() => handler(req, res))
}

// TODO handle action generic type
function actionHandler(action: Action<any>): PromiseHandler {
  return async (request, response) => {
    const logger = response.locals.logger
    Counters.requests.labels(action.io.endpoint).inc()
    // Unique error to be thrown on timeout
    const timeoutError = Symbol()
    tracer
      .startActiveSpan('Controller - handle', async (span) => {
        span.addEvent('Calling init')

        const session = await action.io.init(request, response)
        // Init returns a response to the user internally.
        if (session) {
          span.addEvent('Calling perform')
          await action.perform(session, timeoutError)
        }
        span.end()
      })
      .catch((err: any) => {
        logger.error({ err }, `Error in handler for ${action.io.endpoint}`)

        let errMsg: ErrorType = ErrorMessage.UNKNOWN_ERROR
        if (err === timeoutError) {
          Counters.timeouts.inc()
          errMsg = ErrorMessage.TIMEOUT_FROM_SIGNER
        } else if (
          err instanceof Error &&
          // Propagate standard error & warning messages thrown during endpoint handling
          (Object.values(ErrorMessage).includes(err.message as ErrorMessage) ||
            Object.values(WarningMessage).includes(err.message as WarningMessage))
        ) {
          errMsg = err.message as ErrorType
        }

        action.io.sendFailure(errMsg, 500, response)
      })
  }
}
