import * as dotenv from 'dotenv'
import express from 'express'
import { AttestationRequestType, getAttestationKey, handleAttestationRequest } from './attestation'
import { initializeDB, initializeKit } from './db'
import { createValidatedHandler } from './request'
import { initializeSmsProviders } from './sms'

async function init() {
  console.info(process.env.CONFIG)
  if (process.env.CONFIG) {
    dotenv.config({ path: process.env.CONFIG })
  }

  await initializeDB()
  await initializeKit()
  // TODO: Validate that the attestation key has been authorized by the account
  getAttestationKey()
  await initializeSmsProviders()

  const app = express()
  app.use(express.json())
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`Server running on ${port}!`))

  app.post(
    '/attestations',
    createValidatedHandler(AttestationRequestType, handleAttestationRequest)
  )
}

init().catch((err) => {
  console.error(`Error occurred while running server, exiting ....`)
  console.error(err)
  process.exit(1)
})
