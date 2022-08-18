import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  Endpoint,
  ErrorMessage,
  loggerMiddleware,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import { performance, PerformanceObserver } from 'perf_hooks'
import { CombinerConfig } from '.'
import { Controller } from './common/controller'
import { getContractKit } from './common/web3/contracts'
import { DomainDisableAction } from './domain/endpoints/disable/action'
import { DomainDisableIO } from './domain/endpoints/disable/io'
import { DomainQuotaAction } from './domain/endpoints/quota/action'
import { DomainQuotaIO } from './domain/endpoints/quota/io'
import { DomainSignAction } from './domain/endpoints/sign/action'
import { DomainSignIO } from './domain/endpoints/sign/io'
import { DomainThresholdStateService } from './domain/services/thresholdState'
import { PnPQuotaAction } from './pnp/endpoints/quota/action'
import { PnpSignAction } from './pnp/endpoints/sign/action'
import { PnpSignIO } from './pnp/endpoints/sign/io'
import { LegacyPnpSignIO } from './pnp/endpoints/sign/io.legacy'

require('events').EventEmitter.defaultMaxListeners = 15

export function startCombiner(config: CombinerConfig) {
  const logger = rootLogger(config.serviceName)

  logger.info('Creating combiner express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware(config.serviceName)) // TODO(Alec): get logger to show accurate serviceName

  // app.get(CombinerEndpoint.STATUS, (_req, res) => {
  //   res.status(200).json({
  //     version: getVersion(),
  //   })
  // })

  const kit: ContractKit = getContractKit(config.blockchain)

  const legacyPnpSign = new Controller(
    new PnpSignAction(
      config.phoneNumberPrivacy,
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

  const pnpSign = new Controller(
    new PnpSignAction(config.phoneNumberPrivacy, new PnpSignIO(config.phoneNumberPrivacy, kit))
  )
  app.post(CombinerEndpoint.PNP_SIGN, (req, res) =>
    meterResponse(pnpSign.handle.bind(pnpSign), req, res, CombinerEndpoint.PNP_SIGN, config)
  )

  const pnpQuota = new Controller(
    new PnPQuotaAction(config, new PnpQuotaIO(config.phoneNumberPrivacy, kit))
  )
  app.get(CombinerEndpoint.PNP_QUOTA, (req, res) =>
    meterResponse(pnpQuota.handle.bind(pnpQuota), req, res, CombinerEndpoint.PNP_QUOTA, config)
  )

  const domainThresholdStateService = new DomainThresholdStateService(config.domains)

  const domainQuota = new Controller(
    new DomainQuotaAction(
      config.domains,
      domainThresholdStateService,
      new DomainQuotaIO(config.domains)
    )
  )
  app.get(CombinerEndpoint.DOMAIN_QUOTA_STATUS, (req, res) =>
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
    new DomainDisableAction(config.domains, new DomainDisableIO(config.domains))
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
    const eventLoopLag = Date.now() - eventLoopLagMeasurementStart
    logger.info({ eventLoopLag }, 'Measure event loop lag')
  })
  const startMark = `Begin ${handler.name}`
  const endMark = `End ${handler.name}`
  const entryName = `${handler.name} latency`

  const obs = new PerformanceObserver((list) => {
    const entry = list.getEntriesByName(entryName)[0]
    if (entry) {
      logger.info({ latency: entry }, 'e2e response latency measured')
    }
  })
  obs.observe({ entryTypes: ['measure'], buffered: true })

  performance.mark(startMark)
  await handler(req, res)
    .then(() => {
      logger.info({ res }, 'Response sent')
    })
    .catch((err) => {
      logger.error(ErrorMessage.UNKNOWN_ERROR)
      logger.error(err)
    })
  performance.mark(endMark)
  performance.measure(entryName, startMark, endMark)
  performance.clearMarks()
  obs.disconnect()
}
