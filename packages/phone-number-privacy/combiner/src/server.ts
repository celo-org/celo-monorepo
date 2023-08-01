import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  Endpoint,
  ErrorMessage,
  KEY_VERSION_HEADER,
  loggerMiddleware,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, RequestHandler, Response } from 'express'
// tslint:disable-next-line: ordered-imports
import { performance, PerformanceObserver } from 'perf_hooks'
import { Controller } from './common/controller'
import { CombinerConfig, getCombinerVersion } from './config'
import { DomainDisableAction } from './domain/endpoints/disable/action'
import { DomainDisableIO } from './domain/endpoints/disable/io'
import { DomainQuotaAction } from './domain/endpoints/quota/action'
import { DomainQuotaIO } from './domain/endpoints/quota/io'
import { DomainSignAction } from './domain/endpoints/sign/action'
import { DomainSignIO } from './domain/endpoints/sign/io'
import { DomainThresholdStateService } from './domain/services/threshold-state'
import { PnpQuotaAction } from './pnp/endpoints/quota/action'
import { PnpQuotaIO } from './pnp/endpoints/quota/io'
import { PnpSignAction } from './pnp/endpoints/sign/action'
import { PnpSignIO } from './pnp/endpoints/sign/io'
import { LegacyPnpSignIO } from './pnp/endpoints/sign/io.legacy'
import { PnpThresholdStateService } from './pnp/services/threshold-state'

require('events').EventEmitter.defaultMaxListeners = 15

export function startCombiner(config: CombinerConfig, kit: ContractKit) {
  const logger = rootLogger(config.serviceName)

  logger.info('Creating combiner express server')
  const app = express()
  // TODO get logger to show accurate serviceName
  // (https://github.com/celo-org/celo-monorepo/issues/9809)
  app.use(express.json({ limit: '0.2mb' }) as RequestHandler, loggerMiddleware(config.serviceName))

  // Enable cross origin resource sharing from any domain so ODIS can be interacted with from web apps
  //
  // Security note: Allowing unrestricted cross-origin requests is acceptable here because any authenticated actions
  // must include a signature in the request body. In particular, ODIS _does not_ use cookies to transmit authentication
  // data. If ODIS is altered to use cookies for authentication data, this CORS policy should be reconsidered.
  app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header(
      'Access-Control-Allow-Headers',
      `Origin, X-Requested-With, Content-Type, Accept, Authorization, ${KEY_VERSION_HEADER}`
    )
    next()
  })

  app.get(CombinerEndpoint.STATUS, (_req, res) => {
    res.status(200).json({
      version: getCombinerVersion(),
    })
  })

  const pnpThresholdStateService = new PnpThresholdStateService()

  const legacyPnpSign = new Controller(
    new PnpSignAction(
      config.phoneNumberPrivacy,
      pnpThresholdStateService,
      new LegacyPnpSignIO(config.phoneNumberPrivacy, kit)
    )
  )
  app.post(CombinerEndpoint.LEGACY_PNP_SIGN, (req, res) =>
    meterResponse(
      legacyPnpSign.handle.bind(legacyPnpSign),
      req,
      res,
      CombinerEndpoint.LEGACY_PNP_SIGN,
      config
    )
  )

  const pnpQuota = new Controller(
    new PnpQuotaAction(
      config.phoneNumberPrivacy,
      pnpThresholdStateService,
      new PnpQuotaIO(config.phoneNumberPrivacy, kit)
    )
  )
  app.post(CombinerEndpoint.PNP_QUOTA, (req, res) =>
    meterResponse(pnpQuota.handle.bind(pnpQuota), req, res, CombinerEndpoint.PNP_QUOTA, config)
  )

  const pnpSign = new Controller(
    new PnpSignAction(
      config.phoneNumberPrivacy,
      pnpThresholdStateService,
      new PnpSignIO(config.phoneNumberPrivacy, kit)
    )
  )
  app.post(
    CombinerEndpoint.PNP_SIGN,
    (req, res) =>
      meterResponse(pnpSign.handle.bind(pnpSign), req, res, CombinerEndpoint.PNP_SIGN, config) // (1)
  )

  const domainThresholdStateService = new DomainThresholdStateService(config.domains)

  const domainQuota = new Controller(
    new DomainQuotaAction(
      config.domains,
      domainThresholdStateService,
      new DomainQuotaIO(config.domains)
    )
  )
  app.post(CombinerEndpoint.DOMAIN_QUOTA_STATUS, (req, res) =>
    meterResponse(
      domainQuota.handle.bind(domainQuota),
      req,
      res,
      CombinerEndpoint.DOMAIN_QUOTA_STATUS,
      config
    )
  )
  const domainSign = new Controller(
    new DomainSignAction(
      config.domains,
      domainThresholdStateService,
      new DomainSignIO(config.domains)
    )
  )
  app.post(CombinerEndpoint.DOMAIN_SIGN, (req, res) =>
    meterResponse(
      domainSign.handle.bind(domainSign),
      req,
      res,
      CombinerEndpoint.DOMAIN_SIGN,
      config
    )
  )
  const domainDisable = new Controller(
    new DomainDisableAction(
      config.domains,
      domainThresholdStateService,
      new DomainDisableIO(config.domains)
    )
  )
  app.post(CombinerEndpoint.DISABLE_DOMAIN, (req, res) =>
    meterResponse(
      domainDisable.handle.bind(domainDisable),
      req,
      res,
      CombinerEndpoint.DISABLE_DOMAIN,
      config
    )
  )

  return app
}

export async function meterResponse(
  handler: (req: Request, res: Response) => Promise<void>,
  req: Request,
  res: Response,
  endpoint: Endpoint,
  config: CombinerConfig
) {
  if (!res.locals) {
    res.locals = {}
  }
  const logger: Logger = loggerMiddleware(config.serviceName)(req, res)
  logger.fields.endpoint = endpoint
  logger.info({ req: req.body }, 'Request received')
  const eventLoopLagMeasurementStart = Date.now()
  setTimeout(() => {
    // (2)
    const eventLoopLag = Date.now() - eventLoopLagMeasurementStart
    logger.info({ eventLoopLag }, 'Measure event loop lag')
  })
  const startMark = `Begin ${endpoint}`
  const endMark = `End ${endpoint}`
  const entryName = `${endpoint} latency`

  const obs = new PerformanceObserver((list) => {
    const entry = list.getEntriesByName(entryName)[0]
    if (entry) {
      logger.info({ latency: entry }, 'e2e response latency measured')
    }
  })
  obs.observe({ entryTypes: ['measure'], buffered: false })

  performance.mark(startMark)
  await handler(req, res) // (3)
    .then(() => {
      logger.info({ res }, 'Response sent')
    })
    .catch((err) => {
      logger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
      logger.error(err)
      if (!res.headersSent) {
        logger.info('Responding with error in outer endpoint handler')
        res.status(500).json({
          success: false,
          error: ErrorMessage.UNKNOWN_ERROR,
        })
      } else {
        logger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
      }
    })
    .finally(() => {
      performance.mark(endMark)
      performance.measure(entryName, startMark, endMark)
      performance.clearMarks()
      obs.disconnect()
    })
}
