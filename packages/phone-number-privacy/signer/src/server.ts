import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  getContractKit,
  loggerMiddleware,
  rootLogger,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import express, { Request, Response } from 'express'
import fs from 'fs'
import https from 'https'
import { Knex } from 'knex'
import * as PromClient from 'prom-client'
import { Controller } from './common/controller'
import { KeyProvider } from './common/key-management/key-provider-base'
import { Counters } from './common/metrics'
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
import { LegacyPnpQuotaIO } from './pnp/endpoints/quota/io.legacy'
import { LegacyPnpSignAction } from './pnp/endpoints/sign/action.legacy'
import { OnChainPnpSignAction } from './pnp/endpoints/sign/action.onchain'
import { PnpSignIO } from './pnp/endpoints/sign/io'
import { LegacyPnpSignIO } from './pnp/endpoints/sign/io.legacy'
import { LegacyPnpQuotaService } from './pnp/services/quota.legacy'
import { OnChainPnpQuotaService } from './pnp/services/quota.onchain'

require('events').EventEmitter.defaultMaxListeners = 15

export function startSigner(
  config: SignerConfig,
  db: Knex,
  keyProvider: KeyProvider,
  kit?: ContractKit
) {
  const logger = rootLogger(config.serviceName)

  kit = kit ?? getContractKit(config.blockchain)

  logger.info('Creating signer express server')
  const app = express()
  app.use(express.json({ limit: '0.2mb' }), loggerMiddleware(config.serviceName))

  app.get(SignerEndpoint.STATUS, (_req, res) => {
    res.status(200).json({
      version: getSignerVersion(),
    })
  })

  app.get(SignerEndpoint.METRICS, (_req, res) => {
    res.send(PromClient.register.metrics())
  })

  const addEndpoint = (
    endpoint: SignerEndpoint,
    handler: (req: Request, res: Response) => Promise<void>
  ) =>
    app.post(endpoint, async (req, res) => {
      const childLogger: Logger = res.locals.logger
      try {
        await handler(req, res)
      } catch (err: any) {
        // Handle any errors that otherwise managed to escape the proper handlers
        childLogger.error(ErrorMessage.CAUGHT_ERROR_IN_ENDPOINT_HANDLER)
        childLogger.error(err)
        Counters.errorsCaughtInEndpointHandler.inc()
        if (!res.headersSent) {
          childLogger.info('Responding with error in outer endpoint handler')
          res.status(500).json({
            success: false,
            error: ErrorMessage.UNKNOWN_ERROR,
          })
        } else {
          // Getting to this error likely indicates that the `perform` process
          // does not terminate after sending a response, and then throws an error.
          childLogger.error(ErrorMessage.ERROR_AFTER_RESPONSE_SENT)
          Counters.errorsThrownAfterResponseSent.inc()
        }
      }
    })

  const pnpQuotaService = new OnChainPnpQuotaService(db, kit)
  const legacyPnpQuotaService = new LegacyPnpQuotaService(db, kit)
  const domainQuotaService = new DomainQuotaService(db)

  const pnpQuota = new Controller(
    new PnpQuotaAction(
      config,
      pnpQuotaService,
      new PnpQuotaIO(
        config.api.phoneNumberPrivacy.enabled,
        config.api.phoneNumberPrivacy.shouldFailOpen, // TODO (https://github.com/celo-org/celo-monorepo/issues/9862) consider refactoring config to make the code cleaner
        kit,
        config.timeout
      )
    )
  )
  const pnpSign = new Controller(
    new OnChainPnpSignAction(
      db,
      config,
      pnpQuotaService,
      keyProvider,
      new PnpSignIO(
        config.api.phoneNumberPrivacy.enabled,
        config.api.phoneNumberPrivacy.shouldFailOpen,
        kit,
        config.timeout
      )
    )
  )
  const legacyPnpSign = new Controller(
    new LegacyPnpSignAction(
      db,
      config,
      legacyPnpQuotaService,
      keyProvider,
      new LegacyPnpSignIO(
        config.api.legacyPhoneNumberPrivacy.enabled,
        config.api.legacyPhoneNumberPrivacy.shouldFailOpen,
        kit,
        config.timeout
      )
    )
  )
  const legacyPnpQuota = new Controller(
    new PnpQuotaAction(
      config,
      legacyPnpQuotaService,
      new LegacyPnpQuotaIO(
        config.api.legacyPhoneNumberPrivacy.enabled,
        config.api.legacyPhoneNumberPrivacy.shouldFailOpen,
        kit,
        config.timeout
      )
    )
  )
  const domainQuota = new Controller(
    new DomainQuotaAction(config, domainQuotaService, new DomainQuotaIO(config.api.domains.enabled))
  )
  const domainSign = new Controller(
    new DomainSignAction(
      db,
      config,
      domainQuotaService,
      keyProvider,
      new DomainSignIO(config.api.domains.enabled)
    )
  )
  const domainDisable = new Controller(
    new DomainDisableAction(db, config, new DomainDisableIO(config.api.domains.enabled))
  )
  logger.info('Right before adding meteredSignerEndpoints')
  addEndpoint(SignerEndpoint.PNP_SIGN, pnpSign.handle.bind(pnpSign))
  addEndpoint(SignerEndpoint.PNP_QUOTA, pnpQuota.handle.bind(pnpQuota))
  addEndpoint(SignerEndpoint.DOMAIN_QUOTA_STATUS, domainQuota.handle.bind(domainQuota))
  addEndpoint(SignerEndpoint.DOMAIN_SIGN, domainSign.handle.bind(domainSign))
  addEndpoint(SignerEndpoint.DISABLE_DOMAIN, domainDisable.handle.bind(domainDisable))

  addEndpoint(SignerEndpoint.LEGACY_PNP_SIGN, legacyPnpSign.handle.bind(legacyPnpSign))
  addEndpoint(SignerEndpoint.LEGACY_PNP_QUOTA, legacyPnpQuota.handle.bind(legacyPnpQuota))

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
