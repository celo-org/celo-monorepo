import { ContractKit } from '@celo/contractkit'
import {
  CombinerEndpoint,
  KEY_VERSION_HEADER,
  loggerMiddleware,
  newContractKitFetcher,
  OdisRequest,
  rootLogger,
} from '@celo/phone-number-privacy-common'
import express, { Express, RequestHandler } from 'express'
import httpProxy from 'http-proxy'
import { Signer } from './common/combine'
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

export function startCombiner(config: CombinerConfig, kit: ContractKit): Express {
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

export function startProxy(req: any, res: any, config: CombinerConfig) {
  const logger = rootLogger(config.serviceName)
  const proxy = httpProxy.createProxyServer({})
  let destinationUrl
  const originalPath = req.path
  const strippedPath = originalPath.replace(/\/combiner/, '')

  switch (config.deploymentEnv) {
    case 'mainnet':
      // XXX (soloseng):URL may need to be updated after gen2 function is created on mainnet
      destinationUrl =
        'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net/combinerGen2' +
        proxy.web(req, res, { target: destinationUrl })
      break
    case 'alfajores':
      // XXX (soloseng):URL may need to be updated after gen2 function is created on alfajores
      destinationUrl =
        'https://us-central1-celo-phone-number-privacy.cloudfunctions.net/combinerGen2' +
        strippedPath

      proxy.web(req, res, { target: destinationUrl })
      break
    case 'staging':
      destinationUrl =
        'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net/combinerGen2' +
        strippedPath

      proxy.web(req, res, { target: destinationUrl })
      break
  }
  proxy.on('error', (_) => {
    logger.error('Error in Proxying request to Combiner.')
    res.status(500).json({
      success: false,
      error: 'Error handling you request. Please make sure you are running the latest SDK version.',
    })
  })
}
