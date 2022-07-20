import { CombinerEndpoint as Endpoint } from '@celo/phone-number-privacy-common'
import * as functions from 'firebase-functions'
import config from './config'
import { handleGetContactMatches } from './match-making/get-contact-matches'
import { meterResponse, startCombiner } from './server'

require('dotenv').config()

export const combiner = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(startCombiner(config))

export const getContactMatches = functions
  .region('us-central1', 'europe-west3')
  .runWith(config.cloudFunction)
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(handleGetContactMatches, req, res, Endpoint.MATCHMAKING)
  })

// const pnpSignHandler = new Controller(
//   new PnpSignAction(
//     config.phoneNumberPrivacy,
//     new PnpSignIO(config.phoneNumberPrivacy)
//   )
// )
// export const getBlindedMessageSig = functions
//   .region('us-central1', 'europe-west3')
//   .runWith(config.cloudFunction)
//   .https.onRequest(async (req: functions.Request, res: functions.Response) => {
//     // TODO(Alec): look for other places where 'bind' is needed
//     return meterResponse(
//       pnpSignHandler.handle.bind(pnpSignHandler),
//       req,
//       res,
//       Endpoint.SIGN_MESSAGE
//     )
//   })

// const domainSignHandler = new Controller(
//   new DomainSignAction(
//     config.domains,
//     new DomainSignIO(
//       config.domains
//     ),
//     new DomainThresholdStateService(config.domains)
//   )
// )
// export const domainSign = functions // TODO(Alec): For integration tests, can call these functions directly rather than using supertest pkg
//   .region('us-central1', 'europe-west3')
//   .runWith(config.cloudFunction)
//   .https.onRequest(async (req: functions.Request, res: functions.Response) => {
//     return meterResponse(domainSignHandler.handle, req, res, Endpoint.DOMAIN_SIGN)
//   })

// const domainQuotaStatusHandler = new Controller(
//   new DomainQuotaAction(
//     config.domains,
//     new DomainQuotaIO(
//       config.domains
//     ),
//     new DomainThresholdStateService(config.domains)
//   )
// )
// export const domainQuotaStatus = functions
//   .region('us-central1', 'europe-west3')
//   .runWith(config.cloudFunction)
//   .https.onRequest(async (req: functions.Request, res: functions.Response) => {
//     return meterResponse(domainQuotaStatusHandler.handle, req, res, Endpoint.DOMAIN_QUOTA_STATUS)
//   })

// const domainDisableHandler = new Controller(
//   new DomainDisableAction(
//     config.domains,
//     new DomainDisableIO(
//       config.domains,
//     )
//   )
// )
// export const domainDisable = functions
//   .region('us-central1', 'europe-west3')
//   .runWith(config.cloudFunction)
//   .https.onRequest(async (req: functions.Request, res: functions.Response) => {
//     return meterResponse(domainDisableHandler.handle, req, res, Endpoint.DISABLE_DOMAIN)
//   })

export * from './config'
