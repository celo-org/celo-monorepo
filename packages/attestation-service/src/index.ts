import * as dotenv from 'dotenv'
import express from 'express'
import { handleAttestationRequest } from './attestation'
import { initializeDB, initializeKit } from './db'
import { initializeSmsProviders } from './sms'

async function init() {
  if (process.env.CONFIG) {
    dotenv.config({ path: process.env.CONFIG })
  }

  await initializeDB()
  await initializeKit()
  await initializeSmsProviders()

  const app = express()
  app.use(express.json())
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`Server running on ${port}!`))

  app.post('/attestations', handleAttestationRequest)
}

init().catch((err) => {
  console.error(`Error occurred while running server, exiting ....`)
  console.error(err)
  process.exit(1)
})
