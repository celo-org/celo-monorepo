import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  KEY_VERSION_HEADER,
  loggerMiddleware,
  newContractKitFetcher,
  OdisRequest,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import express, { RequestHandler } from 'express'
import { Signer } from './common/combine'
// tslint:disable-next-line: ordered-imports
import {
  catchErrorHandler,
  disabledHandler,
  meteringHandler,
  PromiseHandler,
} from './common/handlers'
import { CombinerConfig, getCombinerVersion } from './config'
import { createDisableDomainHandler } from './domain/endpoints/disable/action'
import { createDomainQuotaHandler } from './domain/endpoints/quota/action'

import { createDomainSignHandler } from './domain/endpoints/sign/action'

import { createPnpQuotaHandler } from './pnp/endpoints/quota/action'
import { createPnpSignHandler } from './pnp/endpoints/sign/action'

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

  const dekFetcher = newContractKitFetcher(
    kit,
    logger,
    config.phoneNumberPrivacy.fullNodeTimeoutMs,
    config.phoneNumberPrivacy.fullNodeRetryCount,
    config.phoneNumberPrivacy.fullNodeRetryDelayMs
  )

  const pnpSigners: Signer[] = JSON.parse(config.phoneNumberPrivacy.odisServices.signers)
  const pnpQuota = createPnpQuotaHandler(pnpSigners, config.phoneNumberPrivacy, dekFetcher)
  const pnpSign = createPnpSignHandler(pnpSigners, config.phoneNumberPrivacy, dekFetcher)

  const domainSigners: Signer[] = JSON.parse(config.domains.odisServices.signers)
  const domainQuota = createDomainQuotaHandler(domainSigners, config.domains)
  const domainSign = createDomainSignHandler(domainSigners, config.domains)
  const domainDisable = createDisableDomainHandler(domainSigners, config.domains)

  app.post(CombinerEndpoint.PNP_QUOTA, createHandler(config.phoneNumberPrivacy.enabled, pnpQuota))
  app.post(CombinerEndpoint.PNP_SIGN, createHandler(config.phoneNumberPrivacy.enabled, pnpSign))
  app.post(CombinerEndpoint.DOMAIN_QUOTA_STATUS, createHandler(config.domains.enabled, domainQuota))
  app.post(CombinerEndpoint.DOMAIN_SIGN, createHandler(config.domains.enabled, domainSign))
  app.post(CombinerEndpoint.DISABLE_DOMAIN, createHandler(config.domains.enabled, domainDisable))

  return app
}

export function createHandler<R extends OdisRequest>(
  enabled: boolean,
  handler: PromiseHandler<R>
): PromiseHandler<R> {
  return meteringHandler(catchErrorHandler(enabled ? handler : disabledHandler<R>))
}
