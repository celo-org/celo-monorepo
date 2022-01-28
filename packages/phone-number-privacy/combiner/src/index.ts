import {
  CombinerEndpoint as Endpoint,
  ErrorMessage,
  loggerMiddleware,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import * as functions from 'firebase-functions'
import { performance, PerformanceObserver } from 'perf_hooks'
import { DomainDisableService } from './combiner/domain/disable.service'
import {
  DomainDisableInputService,
  DomainQuotaStatusInputService,
  DomainSignInputService,
} from './combiner/domain/input.service'
import { DomainQuotaStatusService } from './combiner/domain/quotastatus.service'
import { DomainSignService } from './combiner/domain/sign.service'
import { PnpInputService } from './combiner/pnp/input.service'
import { PnpSignService } from './combiner/pnp/sign.service'
import config, { FORNO_ALFAJORES, VERSION } from './config'
import { handleGetContactMatches } from './match-making/get-contact-matches'

require('dotenv').config()

async function meterResponse(
  handler: (req: functions.Request, res: functions.Response) => Promise<void>,
  req: functions.Request,
  res: functions.Response,
  endpoint: Endpoint
) {
  if (!res.locals) {
    res.locals = {}
  }
  const logger: Logger = loggerMiddleware(req, res)
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

// TODO(Alec): brainstorm ways to cleanup this code

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -H "Authorization: <SIGNED_BODY>" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
export const getContactMatches = functions
  .region('us-central1', 'europe-west3')
  .runWith({
    // Keep instances warm for this latency-critical function
    // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
    minInstances: config.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    return meterResponse(handleGetContactMatches, req, res, Endpoint.MATCHMAKING)
  })

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedMessageSig" -H "Authorization: 0xfc2ee61c4d18b93374fdd525c9de09d01398f7d153d17340b9ae156f94a1eb3237207d9aacb42e7f2f4ee0cf2621ab6d5a0837211665a99e16e3367f5209a56b1b" -d '{"blindedQueryPhoneNumber":"+Dzuylsdcv1ZxbRcQwhQ29O0UJynTNYufjWc4jpw2Zr9FLu5gSU8bvvDJ3r/Nj+B","account":"0xdd18d08f1c2619ede729c26cc46da19af0a2aa7f", "hashedPhoneNumber":"0x8fb77f2aff2ef0343706535dc702fc99f61a5d1b8e46d7c144c80fd156826a77"}' -H 'Content-Type: application/json'
export const getBlindedMessageSig = functions
  .region('us-central1', 'europe-west3')
  .runWith({
    // Keep instances warm for this latency-critical function
    // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
    minInstances: config.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const blindedMessage = 'TODO(Alec)(Next)'
    const service = new PnpSignService(
      config.phoneNumberPrivacy,
      new PnpInputService(),
      blindedMessage
    )
    return meterResponse(
      service.handleDistributedRequest,
      req,
      res,
      Endpoint.GET_BLINDED_MESSAGE_SIG
    )
  })

export const domainSign = functions
  .region('us-central1', 'europe-west3')
  .runWith({
    // Keep instances warm for this latency-critical function
    // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
    minInstances: config.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const blindedMessage = 'TODO(Alec)(Next)'
    const service = new DomainSignService(
      config.domains,
      new DomainSignInputService(),
      blindedMessage
    )
    return meterResponse(service.handleDistributedRequest, req, res, Endpoint.DOMAIN_SIGN)
  })

export const domainQuotaStatus = functions
  .region('us-central1', 'europe-west3')
  .runWith({
    // Keep instances warm for this latency-critical function
    // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
    minInstances: config.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const service = new DomainQuotaStatusService(
      config.domains,
      new DomainQuotaStatusInputService()
    )
    return meterResponse(service.handleDistributedRequest, req, res, Endpoint.DOMAIN_QUOTA_STATUS)
  })

export const domainDisable = functions
  .region('us-central1', 'europe-west3')
  .runWith({
    // Keep instances warm for this latency-critical function
    // @ts-ignore https://firebase.google.com/docs/functions/manage-functions#reduce_the_number_of_cold_starts
    minInstances: config.blockchain.provider === FORNO_ALFAJORES ? 0 : 3,
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    const service = new DomainDisableService(config.domains, new DomainDisableInputService())
    return meterResponse(service.handleDistributedRequest, req, res, Endpoint.DISABLE_DOMAIN)
  })

export const status = functions
  .region('us-central1', 'europe-west3')
  .https.onRequest(async (_request, response) => {
    response.status(200).json({
      version: VERSION,
    })
  })
