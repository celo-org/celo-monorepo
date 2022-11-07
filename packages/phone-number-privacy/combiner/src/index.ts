import * as functions from 'firebase-functions'
import config from './config'
import { startCombiner } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(startCombiner(config))

// TODO(2.0.0, deployment) determine if we can delete these endpoints in favor of the above in a backwards compatible way. This will require testing e2e against a deployed service.
/*

const pnpSignHandler = new Controller(
  new PnpSignAction(
    config.phoneNumberPrivacy,
    new PnpSignIO(config.phoneNumberPrivacy)
  )
)
export const getBlindedMessageSig = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(
      pnpSignHandler.handle.bind(pnpSignHandler),
      req,
      res,
      Endpoint.SIGN_MESSAGE
    )
  })

const domainSignHandler = new Controller(
  new DomainSignAction(
    config.domains,
    new DomainSignIO(
      config.domains
    ),
    new DomainThresholdStateService(config.domains)
  )
)
export const domainSign = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(domainSignHandler.handle.bind(domainSignHandler), req, res, Endpoint.DOMAIN_SIGN)
  })

const domainQuotaStatusHandler = new Controller(
  new DomainQuotaAction(
    config.domains,
    new DomainQuotaIO(
      config.domains
    ),
    new DomainThresholdStateService(config.domains)
  )
)
export const domainQuotaStatus = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(domainQuotaStatusHandler.handle.bind(domainQuotaStatusHandler), req, res, Endpoint.DOMAIN_QUOTA_STATUS)
  })

const domainDisableHandler = new Controller(
  new DomainDisableAction(
    config.domains,
    new DomainDisableIO(
      config.domains,
    )
  )
)
export const domainDisable = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(domainDisableHandler.handle.bind(domainDisableHandler), req, res, Endpoint.DISABLE_DOMAIN)
  })
*/
export * from './config'
