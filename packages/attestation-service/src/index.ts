import { AttestationServiceTestRequestType } from '@celo/utils/lib/io'
import express from 'express'
import rateLimit from 'express-rate-limit'
import requestIdMiddleware from 'express-request-id'
import * as PromClient from 'prom-client'
import { initializeDB, initializeKit, verifyConfiguration } from './db'
import { fetchEnv, fetchEnvOrDefault, isYes } from './env'
import { rootLogger } from './logger'
import { asyncHandler, createValidatedHandler, loggerMiddleware } from './request'
import { AttestationRequestType, handleAttestationRequest } from './requestHandlers/attestation'
import { handleAttestationDeliveryStatus } from './requestHandlers/delivery'
import { handleLivenessRequest } from './requestHandlers/liveness'
import { handleStatusRequest, StatusRequestType } from './requestHandlers/status'
import { handleTestAttestationRequest } from './requestHandlers/test_attestation'
import { initializeSmsProviders, smsProvidersWithDeliveryStatus } from './sms'

const deliveryStatusURLForProviderType = (t: string) =>
  `${fetchEnv('EXTERNAL_CALLBACK_HOSTPORT')}/delivery_status_${t}`

async function init() {
  await initializeDB()
  await initializeKit()

  // Verify configuration.

  if (isYes(fetchEnvOrDefault('VERIFY_CONFIG_ON_STARTUP', '1'))) {
    await verifyConfiguration()
  }

  await initializeSmsProviders(deliveryStatusURLForProviderType)

  const app = express()
  app.use([requestIdMiddleware(), loggerMiddleware])
  const port = process.env.PORT || 3000
  app.listen(port, () => rootLogger.info({ port }, 'Attestation Service started'))

  const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 100, // 5 minutes
    max: 50,
  })
  app.get('/metrics', (_req, res) => {
    res.send(PromClient.register.metrics())
  })
  app.get('/status', rateLimiter, createValidatedHandler(StatusRequestType, handleStatusRequest))
  app.get('/ready', rateLimiter, (_req, res) => {
    res.send('Ready').status(200)
  })
  app.get('/healthz', rateLimiter, asyncHandler(handleLivenessRequest))
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
    rootLogger.info(
      { url: deliveryStatusURLForProviderType(p.type) },
      'Registered delivery status handler'
    )
    app.post(path, ...p.deliveryStatusHandlers(), handleAttestationDeliveryStatus(p.type))
  }
}

init().catch((err) => {
  rootLogger.error({ err }, 'Unexpected error during intialization')
  process.exit(1)
})
