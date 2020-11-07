import {
  AttestationRequestType,
  AttestationServiceTestRequestType,
  GetAttestationRequestType,
} from '@celo/utils/lib/io'
import express from 'express'
import rateLimit from 'express-rate-limit'
import requestIdMiddleware from 'express-request-id'
import * as PromClient from 'prom-client'
import {
  initializeDB,
  initializeKit,
  startPeriodicHealthCheck,
  verifyConfigurationAndGetURL,
} from './db'
import { fetchEnv, fetchEnvOrDefault, isDevMode, isYes } from './env'
import { rootLogger } from './logger'
import { asyncHandler, createValidatedHandler, loggerMiddleware } from './request'
import { handleAttestationRequest } from './requestHandlers/attestation'
import { handleAttestationDeliveryStatus } from './requestHandlers/delivery'
import { handleGetAttestationRequest } from './requestHandlers/get_attestation'
import { handleLivenessRequest } from './requestHandlers/liveness'
import { handleStatusRequest, StatusRequestType } from './requestHandlers/status'
import { handleTestAttestationRequest } from './requestHandlers/test_attestation'
import { initializeSmsProviders, smsProvidersWithDeliveryStatus } from './sms'

async function init() {
  await initializeDB()
  await initializeKit()

  let externalURL: string

  // Verify configuration if VERIFY_CONFIG_ON_STARTUP is set.
  // (in this case, we can use the URL in the claim if EXTERNAL_CALLBACK_HOSTPORT is missing)
  if (!isDevMode() && isYes(fetchEnvOrDefault('VERIFY_CONFIG_ON_STARTUP', '1'))) {
    const claimURL = await verifyConfigurationAndGetURL()
    externalURL = fetchEnvOrDefault('EXTERNAL_CALLBACK_HOSTPORT', claimURL)
  } else {
    externalURL = fetchEnv('EXTERNAL_CALLBACK_HOSTPORT')
  }

  const deliveryStatusURLForProviderType = (t: string) => `${externalURL}/delivery_status_${t}`

  await initializeSmsProviders(deliveryStatusURLForProviderType)

  await startPeriodicHealthCheck()

  const rateLimitReqsPerMin = parseInt(fetchEnvOrDefault('RATE_LIMIT_REQS_PER_MIN', '100'), 10)
  const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: rateLimitReqsPerMin,
  })

  const app = express()
  app.use([requestIdMiddleware(), loggerMiddleware, rateLimiter])
  const port = process.env.PORT || 3000
  app.listen(port, () =>
    rootLogger.info({ port, rateLimitReqsPerMin }, 'Attestation Service started')
  )

  app.get('/metrics', (_req, res) => {
    res.send(PromClient.register.metrics())
  })
  app.get('/status', createValidatedHandler(StatusRequestType, handleStatusRequest))
  app.get('/ready', (_req, res) => {
    res.send('Ready').status(200)
  })
  app.get('/healthz', asyncHandler(handleLivenessRequest))
  app.get(
    '/get_attestations',
    createValidatedHandler(GetAttestationRequestType, handleGetAttestationRequest)
  )
  app.post(
    '/attestations',
    express.json(),
    createValidatedHandler(AttestationRequestType, handleAttestationRequest)
  )
  app.post(
    '/test_attestations',
    express.json(),
    createValidatedHandler(AttestationServiceTestRequestType, handleTestAttestationRequest)
  )

  for (const p of smsProvidersWithDeliveryStatus()) {
    const path = `/delivery_status_${p.type}`
    const method = p.deliveryStatusMethod()
    rootLogger.info(
      { method, url: deliveryStatusURLForProviderType(p.type) },
      'Registered delivery status handler'
    )
    if (method === 'POST') {
      app.post(path, ...p.deliveryStatusHandlers(), handleAttestationDeliveryStatus(p.type))
    } else if (method === 'GET') {
      app.get(path, ...p.deliveryStatusHandlers(), handleAttestationDeliveryStatus(p.type))
    } else {
      throw new Error(`Unknown method ${method} for ${path}`)
    }
  }
}

init().catch((err) => {
  rootLogger.error({ err }, 'Unexpected error during intialization')
  process.exit(1)
})
