import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  KEY_VERSION_HEADER,
  loggerMiddleware,
  OdisRequest,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import express, { RequestHandler } from 'express'
// tslint:disable-next-line: ordered-imports
import {
  actionHandler,
  catchErrorHandler,
  meteringHandler,
  PromiseHandler,
} from './common/handlers'
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

  const pnpQuota = actionHandler(
    new PnpQuotaAction(
      config.phoneNumberPrivacy,
      pnpThresholdStateService,
      new PnpQuotaIO(config.phoneNumberPrivacy, kit)
    )
  )

  const pnpSign = actionHandler(
    new PnpSignAction(
      config.phoneNumberPrivacy,
      pnpThresholdStateService,
      new PnpSignIO(config.phoneNumberPrivacy, kit)
    )
  )

  const domainThresholdStateService = new DomainThresholdStateService(config.domains)

  const domainQuota = actionHandler(
    new DomainQuotaAction(
      config.domains,
      domainThresholdStateService,
      new DomainQuotaIO(config.domains)
    )
  )

  const domainSign = actionHandler(
    new DomainSignAction(
      config.domains,
      domainThresholdStateService,
      new DomainSignIO(config.domains)
    )
  )

  const domainDisable = actionHandler(
    new DomainDisableAction(
      config.domains,
      domainThresholdStateService,
      new DomainDisableIO(config.domains)
    )
  )

  app.post(CombinerEndpoint.PNP_QUOTA, createHandler(pnpQuota))
  app.post(CombinerEndpoint.PNP_SIGN, createHandler(pnpSign))
  app.post(CombinerEndpoint.DOMAIN_QUOTA_STATUS, createHandler(domainQuota))
  app.post(CombinerEndpoint.DOMAIN_SIGN, createHandler(domainSign))
  app.post(CombinerEndpoint.DISABLE_DOMAIN, createHandler(domainDisable))

  return app
}

export function createHandler<R extends OdisRequest>(
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return meteringHandler(catchErrorHandler(handler))
}
