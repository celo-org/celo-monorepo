import express from 'express'
import RateLimiter from 'express-rate-limit'
import requestIdMiddleware from 'express-request-id'
import * as PromClient from 'prom-client'
import { initializeDB, initializeKit } from './db'
import { rootLogger } from './logger'
import { createValidatedHandler, loggerMiddleware } from './request'
import {
  AttestationRequestType,
  getAccountAddress,
  getAttestationKey,
  handleAttestationRequest,
} from './requestHandlers/attestation'
import { handleStatusRequest, StatusRequestType } from './requestHandlers/status'
import { initializeSmsProviders } from './sms'

async function init() {
  await initializeDB()
  await initializeKit()
  // TODO: Validate that the attestation key has been authorized by the account
  getAttestationKey()
  getAccountAddress()
  await initializeSmsProviders()

  const app = express()
  app.use([express.json(), requestIdMiddleware(), loggerMiddleware])
  const port = process.env.PORT || 3000
  app.listen(port, () => rootLogger.info({ port }, 'Attestation Service started'))

  const rateLimiter = new RateLimiter({
    windowMs: 5 * 60 * 100, // 5 minutes
    max: 50,
    // @ts-ignore
    message: { status: false, error: 'Too many requests, please try again later' },
  })
  app.get('/metrics', (_req, res) => {
    res.send(PromClient.register.metrics())
  })
  app.get('/status', rateLimiter, createValidatedHandler(StatusRequestType, handleStatusRequest))
  app.post(
    '/attestations',
    createValidatedHandler(AttestationRequestType, handleAttestationRequest)
  )
}

init().catch((err) => {
  rootLogger.error({ err })
  process.exit(1)
})
