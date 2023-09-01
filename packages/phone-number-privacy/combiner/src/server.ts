import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  getContractKitWithAgent,
  KEY_VERSION_HEADER,
  loggerMiddleware,
  newContractKitFetcher,
  OdisRequest,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import express, { RequestHandler } from 'express'
import { Signer } from './common/combine'
import {
  catchErrorHandler,
  disabledHandler,
  Locals,
  meteringHandler,
  resultHandler,
  ResultHandler,
  timeoutHandler,
  tracingHandler,
} from './common/handlers'
import { CombinerConfig, getCombinerVersion } from './config'
import { disableDomain } from './domain/endpoints/disable/action'
import { domainQuota } from './domain/endpoints/quota/action'
import { domainSign } from './domain/endpoints/sign/action'
import { pnpQuota } from './pnp/endpoints/quota/action'
import { pnpSign } from './pnp/endpoints/sign/action'

require('events').EventEmitter.defaultMaxListeners = 15

export function startCombiner(config: CombinerConfig, kit?: ContractKit) {
  const logger = rootLogger(config.serviceName)

  kit = kit ?? getContractKitWithAgent(config.blockchain)

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
  const domainSigners: Signer[] = JSON.parse(config.domains.odisServices.signers)

  const { domains, phoneNumberPrivacy } = config

  app.post(
    CombinerEndpoint.PNP_QUOTA,
    createHandler(
      phoneNumberPrivacy.odisServices.timeoutMilliSeconds,
      phoneNumberPrivacy.enabled,
      pnpQuota(pnpSigners, config.phoneNumberPrivacy, dekFetcher)
    )
  )
  app.post(
    CombinerEndpoint.PNP_SIGN,
    createHandler(
      phoneNumberPrivacy.odisServices.timeoutMilliSeconds,
      phoneNumberPrivacy.enabled,
      pnpSign(pnpSigners, config.phoneNumberPrivacy, dekFetcher)
    )
  )
  app.post(
    CombinerEndpoint.DOMAIN_QUOTA_STATUS,
    createHandler(
      domains.odisServices.timeoutMilliSeconds,
      domains.enabled,
      domainQuota(domainSigners, config.domains)
    )
  )
  app.post(
    CombinerEndpoint.DOMAIN_SIGN,
    createHandler(
      domains.odisServices.timeoutMilliSeconds,
      config.domains.enabled,
      domainSign(domainSigners, config.domains)
    )
  )
  app.post(
    CombinerEndpoint.DISABLE_DOMAIN,
    createHandler(
      domains.odisServices.timeoutMilliSeconds,
      config.domains.enabled,
      disableDomain(domainSigners, config.domains)
    )
  )

  return app
}

function createHandler<R extends OdisRequest>(
  timeoutMs: number,
  enabled: boolean,
  action: ResultHandler<R>
): RequestHandler<{}, {}, R, {}, Locals> {
  return catchErrorHandler(
    tracingHandler(
      meteringHandler(timeoutHandler(timeoutMs, enabled ? resultHandler(action) : disabledHandler))
    )
  )
}
