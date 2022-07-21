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
import { CombinerConfig } from '.'
import { Controller } from './refactor/controller'
import { DomainDisableAction } from './refactor/domain/endpoints/disable/action'
import { DomainDisableIO } from './refactor/domain/endpoints/disable/io'
import { DomainQuotaAction } from './refactor/domain/endpoints/quota/action'
import { DomainQuotaIO } from './refactor/domain/endpoints/quota/io'
import { DomainSignAction } from './refactor/domain/endpoints/sign/action'
import { DomainSignIO } from './refactor/domain/endpoints/sign/io'
import { DomainThresholdStateService } from './refactor/domain/services/thresholdState'
import { PnpSignAction } from './refactor/pnp/endpoints/sign/action'
import { PnpSignIO } from './refactor/pnp/endpoints/sign/io'
import { getContractKit } from './web3/contracts'

require('events').EventEmitter.defaultMaxListeners = 15

export function startCombiner(config: CombinerConfig) {
  const logger = rootLogger()

  logger.info('Creating combiner express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware)

  // app.get(CombinerEndpoint.STATUS, (_req, res) => {
  //   res.status(200).json({
  //     version: getVersion(),
  //   })
  // })

  // app.get(CombinerEndpoint.METRICS, (_req, res) => {
  //   res.send(PromClient.register.metrics())
  // })

  const kit: ContractKit = getContractKit(config.blockchain)

  const pnpSign = new Controller(
    new PnpSignAction(config.phoneNumberPrivacy, new PnpSignIO(config.phoneNumberPrivacy, kit))
  )
  app.post(CombinerEndpoint.SIGN_MESSAGE, (req, res) =>
    meterResponse(pnpSign.handle, req, res, CombinerEndpoint.SIGN_MESSAGE)
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
    meterResponse(domainQuota.handle, req, res, CombinerEndpoint.DOMAIN_QUOTA_STATUS)
  )
  const domainSign = new Controller(
    new DomainSignAction(
      config.domains,
      domainThresholdStateService,
      new DomainSignIO(config.domains)
    )
  )
  app.post(CombinerEndpoint.DOMAIN_SIGN, (req, res) =>
    meterResponse(domainSign.handle, req, res, CombinerEndpoint.DOMAIN_SIGN)
  )
  const domainDisable = new Controller(
    new DomainDisableAction(config.domains, new DomainDisableIO(config.domains))
  )
  app.post(CombinerEndpoint.DISABLE_DOMAIN, (req, res) =>
    meterResponse(domainDisable.handle, req, res, CombinerEndpoint.DISABLE_DOMAIN)
  )

  return app
}

export async function meterResponse(
  handler: (req: Request, res: Response) => Promise<void>,
  req: Request,
  res: Response,
  endpoint: Endpoint
) {
  if (!res.locals) {
    res.locals = {}
  }
  const logger: Logger = loggerMiddleware(req, res) // TODO(Alec)
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
