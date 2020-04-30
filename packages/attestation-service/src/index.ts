import { AttestationServiceTestRequestType } from '@celo/utils/lib/io'
import express from 'express'
import rateLimit from 'express-rate-limit'
import requestIdMiddleware from 'express-request-id'
import * as PromClient from 'prom-client'
import { initializeDB, initializeKit } from './db'
import { getAccountAddress, getAttestationSignerAddress } from './env'
import { rootLogger } from './logger'
import { createValidatedHandler, loggerMiddleware } from './request'
import { AttestationRequestType, handleAttestationRequest } from './requestHandlers/attestation'
import { handleStatusRequest, StatusRequestType } from './requestHandlers/status'
import { handleTestAttestationRequest } from './requestHandlers/test_attestation'
import { initializeSmsProviders } from './sms'

async function init() {
  await initializeDB()
  await initializeKit()
  // TODO: Validate that the attestation signer has been authorized by the account
  getAttestationSignerAddress()
  getAccountAddress()
  await initializeSmsProviders()

  const app = express()
  app.use([express.json(), requestIdMiddleware(), loggerMiddleware])
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
  app.post(
    '/attestations',
    createValidatedHandler(AttestationRequestType, handleAttestationRequest)
  )
  app.post(
    '/test_attestations',
    createValidatedHandler(AttestationServiceTestRequestType, handleTestAttestationRequest)
  )
}

init().catch((err) => {
  rootLogger.error({ err })
  process.exit(1)
})
